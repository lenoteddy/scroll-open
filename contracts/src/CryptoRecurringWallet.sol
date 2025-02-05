// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error CryptoRecurringWallet__InvalidOperatorIndex();
error CryptoRecurringWallet__InvalidTokenIndex();
error CryptoRecurringWallet__InvalidContractIndex();
error CryptoRecurringWallet__NotAllowedOperator(address _operator);
error CryptoRecurringWallet__NotAllowedContract(address _contract);
error CryptoRecurringWallet__FailedTx(bytes _data);
error CryptoRecurringWallet__FailedWithdrawEther(uint256 _amount);
error CryptoRecurringWallet__FailedWithdrawToken(
    address _token,
    uint256 _amount
);

contract CryptoRecurringWallet is Ownable2Step {
    address[] private s_operators;
    address[] private s_tokens;
    address[] private s_contracts;
    mapping(address => bool) private s_isOperator;
    mapping(address => bool) private s_isToken;
    mapping(address => bool) private s_isContract;

    event executedTransactions(bytes txData);
    event setOperatorsList(address[] indexed operatorsList);
    event setTokensList(address[] indexed tokensList);
    event setContractsList(address[] indexed contractsList);

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
        uint256 _ethAmount,
        bytes memory _data
    ) external {
        if (!s_isOperator[msg.sender]) {
            revert CryptoRecurringWallet__NotAllowedOperator(msg.sender);
        }
        if (!s_isContract[_contract]) {
            revert CryptoRecurringWallet__NotAllowedContract(_contract);
        }

        (bool success, bytes memory data) = _contract.call{value: _ethAmount}(
            _data
        );
        if (!success) {
            revert CryptoRecurringWallet__FailedTx(data);
        }
        emit executedTransactions(data);
    }

    function withdrawEther(uint256 _amount) external onlyOwner {
        (bool success, ) = owner().call{value: _amount}("");
        if (!success) {
            revert CryptoRecurringWallet__FailedWithdrawEther(_amount);
        }
    }

    function withdrawToken(address _token, uint256 _amount) external onlyOwner {
        if (!IERC20(_token).transfer(owner(), _amount)) {
            revert CryptoRecurringWallet__FailedWithdrawToken(_token, _amount);
        }
    }

    function addOperators(address _operator) external onlyOwner {
        s_operators.push(_operator);
        s_isOperator[_operator] = true;
        emit setOperatorsList(s_operators);
    }

    function removeOperators(uint256 _index) external onlyOwner {
        if (_index > s_operators.length - 1) {
            revert CryptoRecurringWallet__InvalidOperatorIndex();
        }
        address operatorToRemove = s_operators[_index];
        address lastOperator = s_operators[s_operators.length - 1];
        s_operators[_index] = lastOperator;
        s_operators.pop();
        s_isOperator[operatorToRemove] = false;
        emit setOperatorsList(s_operators);
    }

    function setOperators(address[] calldata _operators) external onlyOwner {
        s_operators = _operators;
        emit setOperatorsList(_operators);
    }

    function addTokens(address _token) external onlyOwner {
        s_tokens.push(_token);
        s_isToken[_token] = true;
        emit setTokensList(s_tokens);
    }

    function removeTokens(uint256 _index) external onlyOwner {
        if (_index > s_tokens.length - 1) {
            revert CryptoRecurringWallet__InvalidTokenIndex();
        }
        address tokenToRemove = s_tokens[_index];
        address lastToken = s_tokens[s_tokens.length - 1];
        s_tokens[_index] = lastToken;
        s_tokens.pop();
        s_isToken[tokenToRemove] = false;
        emit setTokensList(s_tokens);
    }

    function setTokens(address[] calldata _tokens) external onlyOwner {
        s_tokens = _tokens;
        emit setTokensList(_tokens);
    }

    function addContracts(address _contract) external onlyOwner {
        s_contracts.push(_contract);
        s_isContract[_contract] = true;
        emit setContractsList(s_contracts);
    }

    function removeContracts(uint256 _index) external onlyOwner {
        if (_index > s_contracts.length - 1) {
            revert CryptoRecurringWallet__InvalidContractIndex();
        }
        address contractToRemove = s_contracts[_index];
        address lastContract = s_contracts[s_contracts.length - 1];
        s_contracts[_index] = lastContract;
        s_contracts.pop();
        s_isContract[contractToRemove] = false;
        emit setContractsList(s_contracts);
    }

    function setContracts(address[] calldata _contracts) external onlyOwner {
        s_contracts = _contracts;
        emit setContractsList(_contracts);
    }

    function getOperatorLength() public view returns (uint256) {
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
