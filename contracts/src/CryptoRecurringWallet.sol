// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CryptoRecurringWallet is ReentrancyGuard, Ownable2Step {
    /* Errors */
    error CryptoRecurringWallet__InvalidOperatorIndex();
    error CryptoRecurringWallet__InvalidTokenIndex();
    error CryptoRecurringWallet__InvalidContractIndex();
    error CryptoRecurringWallet__InsufficientETHBalance();
    error CryptoRecurringWallet__InsufficientTokenBalance();
    error CryptoRecurringWallet__NoTokenOut();
    error CryptoRecurringWallet__NoEtherOut();
    error CryptoRecurringWallet__NotAllowedOperator(address _operator);
    error CryptoRecurringWallet__NotAllowedContract(address _contract);
    error CryptoRecurringWallet__NotAllowedTokenIn(address _token);
    error CryptoRecurringWallet__NotAllowedTokenOut(address _token);
    error CryptoRecurringWallet__FailedTx(bytes _data);
    error CryptoRecurringWallet__FailedWithdrawEther(uint256 _amount);
    error CryptoRecurringWallet__FailedWithdrawToken(
        address _token,
        uint256 _amount
    );

    using SafeERC20 for IERC20;

    address[] private s_operators;
    address[] private s_tokens;
    address[] private s_contracts;
    mapping(address => bool) private s_isOperator;
    mapping(address => bool) private s_isToken;
    mapping(address => bool) private s_isContract;

    event ExecutedTransaction(
        address indexed operator,
        address indexed dex,
        address indexed tokenIn,
        address tokenOut,
        uint256 ethAmount,
        bytes data
    );
    event SetOperatorsList(address[] indexed operatorsList);
    event SetTokensList(address[] indexed tokensList);
    event SetContractsList(address[] indexed contractsList);

    constructor(
        address _user,
        address[] memory _operators,
        address[] memory _tokens,
        address[] memory _contracts
    ) Ownable(_user) {
        s_operators = _operators;
        s_tokens = _tokens;
        s_contracts = _contracts;
    }

    receive() external payable {}

    function executeTx(
        address _contract,
        address _tokenIn,
        address _tokenOut,
        uint256 _ethAmount,
        bytes memory _data
    ) external nonReentrant {
        if (address(this).balance < _ethAmount) {
            revert CryptoRecurringWallet__InsufficientETHBalance();
        }
        if (!s_isOperator[msg.sender]) {
            revert CryptoRecurringWallet__NotAllowedOperator(msg.sender);
        }
        if (!s_isContract[_contract]) {
            revert CryptoRecurringWallet__NotAllowedContract(_contract);
        }
        if (_tokenIn != address(0) && !s_isToken[_tokenIn]) {
            revert CryptoRecurringWallet__NotAllowedTokenIn(_tokenIn);
        }
        if (_tokenOut != address(0) && !s_isToken[_tokenOut]) {
            revert CryptoRecurringWallet__NotAllowedTokenOut(_tokenOut);
        }

        // fetch balance of ETH and Token before tx
        uint256 ethBalanceBefore = address(this).balance;
        uint256 tokenOutBalanceBefore = IERC20(_tokenOut).balanceOf(
            address(this)
        );

        // check `_tokenIn`
        if (_tokenIn != address(0)) {
            uint256 tokenInBalance = IERC20(_tokenIn).balanceOf(address(this));

            // Ensure the contract has enough `_tokenIn` before swapping
            if (tokenInBalance <= 0) {
                revert CryptoRecurringWallet__InsufficientTokenBalance();
            }

            // Check current allowance
            uint256 currentAllowance = IERC20(_tokenIn).allowance(
                address(this),
                _contract
            );
            if (currentAllowance < tokenInBalance) {
                IERC20(_tokenIn).safeIncreaseAllowance(
                    _contract,
                    tokenInBalance
                );
            }
        }

        // Execute transaction
        (bool success, bytes memory data) = _contract.call{value: _ethAmount}(
            _data
        );
        if (!success) {
            revert CryptoRecurringWallet__FailedTx(data);
        }

        // If swapping tokens, ensure `_tokenOut` increased
        if (_tokenOut != address(0)) {
            uint256 tokenOutBalanceAfter = IERC20(_tokenOut).balanceOf(
                address(this)
            );
            if (tokenOutBalanceAfter <= tokenOutBalanceBefore) {
                revert CryptoRecurringWallet__NoTokenOut();
            }
        } else {
            uint256 ethBalanceAfter = address(this).balance;
            if (ethBalanceAfter <= ethBalanceBefore) {
                revert CryptoRecurringWallet__NoEtherOut();
            }
        }

        emit ExecutedTransaction(
            msg.sender,
            _contract,
            _tokenIn,
            _tokenOut,
            _ethAmount,
            _data
        );
    }

    function withdrawEther(uint256 _amount) external onlyOwner {
        (bool success, ) = owner().call{value: _amount}("");
        if (!success) {
            revert CryptoRecurringWallet__FailedWithdrawEther(_amount);
        }
    }

    function withdrawToken(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(owner(), _amount);
    }

    function addOperators(address _operator) external onlyOwner {
        s_operators.push(_operator);
        s_isOperator[_operator] = true;
        emit SetOperatorsList(s_operators);
    }

    function removeOperators(uint256 _index) external onlyOwner {
        if (s_operators.length == 0 || _index > s_operators.length - 1) {
            revert CryptoRecurringWallet__InvalidOperatorIndex();
        }
        address operatorToRemove = s_operators[_index];
        address lastOperator = s_operators[s_operators.length - 1];
        s_operators[_index] = lastOperator;
        s_operators.pop();
        s_isOperator[operatorToRemove] = false;
        emit SetOperatorsList(s_operators);
    }

    function setOperators(address[] calldata _operators) external onlyOwner {
        s_operators = _operators;
        emit SetOperatorsList(_operators);
    }

    function addTokens(address _token) external onlyOwner {
        s_tokens.push(_token);
        s_isToken[_token] = true;
        emit SetTokensList(s_tokens);
    }

    function removeTokens(uint256 _index) external onlyOwner {
        if (s_tokens.length == 0 || _index > s_tokens.length - 1) {
            revert CryptoRecurringWallet__InvalidTokenIndex();
        }
        address tokenToRemove = s_tokens[_index];
        address lastToken = s_tokens[s_tokens.length - 1];
        s_tokens[_index] = lastToken;
        s_tokens.pop();
        s_isToken[tokenToRemove] = false;
        emit SetTokensList(s_tokens);
    }

    function setTokens(address[] calldata _tokens) external onlyOwner {
        s_tokens = _tokens;
        emit SetTokensList(_tokens);
    }

    function addContracts(address _contract) external onlyOwner {
        s_contracts.push(_contract);
        s_isContract[_contract] = true;
        emit SetContractsList(s_contracts);
    }

    function removeContracts(uint256 _index) external onlyOwner {
        if (s_contracts.length == 0 || _index > s_contracts.length - 1) {
            revert CryptoRecurringWallet__InvalidContractIndex();
        }
        address contractToRemove = s_contracts[_index];
        address lastContract = s_contracts[s_contracts.length - 1];
        s_contracts[_index] = lastContract;
        s_contracts.pop();
        s_isContract[contractToRemove] = false;
        emit SetContractsList(s_contracts);
    }

    function setContracts(address[] calldata _contracts) external onlyOwner {
        s_contracts = _contracts;
        emit SetContractsList(_contracts);
    }

    function getOperatorsLength() public view returns (uint256) {
        return s_operators.length;
    }

    function getTokensLength() public view returns (uint256) {
        return s_tokens.length;
    }

    function getContractsLength() public view returns (uint256) {
        return s_contracts.length;
    }

    function getOperator(uint256 index) public view returns (address) {
        return s_operators[index];
    }

    function getToken(uint256 index) public view returns (address) {
        return s_tokens[index];
    }

    function getContract(uint256 index) public view returns (address) {
        return s_contracts[index];
    }
}
