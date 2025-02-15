// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {console} from "forge-std/console.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {ERC20Mock} from "test/mocks/ERC20.sol";
import {CryptoRecurringFactory} from "src/CryptoRecurringFactory.sol";
import {CryptoRecurringWallet} from "src/CryptoRecurringWallet.sol";

contract CryptoRecurringWalletTest is Test, IERC20Errors {
    CryptoRecurringWallet public cryptoRecurringWallet;
    ERC20Mock public token;

    address public DEPLOYER = makeAddr("deployer");
    address public USER = makeAddr("user");
    address public OPERATOR = makeAddr("operator");
    address public CONTRACT = makeAddr("contract");
    uint256 public constant STARTING_USER_ETH_BALANCE = 1 ether;
    uint256 public constant STARTING_USER_TOKEN_BALANCE = 1 ether;

    // address public TOKEN = makeAddr("token");

    function setUp() external {
        vm.deal(USER, STARTING_USER_ETH_BALANCE);
        vm.startBroadcast();
        CryptoRecurringFactory cryptoRecurringFactory = new CryptoRecurringFactory();
        cryptoRecurringFactory.createWallet(
            USER,
            new address[](0),
            new address[](0),
            new address[](0)
        );
        cryptoRecurringWallet = CryptoRecurringWallet(
            payable(cryptoRecurringFactory.getWallet(0))
        );
        token = new ERC20Mock();
        token.mint(USER, STARTING_USER_TOKEN_BALANCE);
        vm.stopBroadcast();
    }

    function testWalletOperators() public {
        // testing `addOperators` function
        vm.prank(USER);
        cryptoRecurringWallet.addOperators(OPERATOR);
        assert(cryptoRecurringWallet.getOperatorsLength() == 1);
        assert(cryptoRecurringWallet.getOperator(0) == OPERATOR);

        // testing `removeOperators` function
        vm.prank(USER);
        cryptoRecurringWallet.removeOperators(0);
        assert(cryptoRecurringWallet.getOperatorsLength() == 0);

        // testing `setOperators` function
        vm.prank(USER);
        address[] memory operators = new address[](1);
        operators[0] = OPERATOR;
        cryptoRecurringWallet.setOperators(operators);
        assert(cryptoRecurringWallet.getOperatorsLength() == 1);
        assert(cryptoRecurringWallet.getOperator(0) == OPERATOR);
    }

    function testWalletOperatorsFailed() public {
        vm.expectRevert(
            CryptoRecurringWallet
                .CryptoRecurringWallet__InvalidOperatorIndex
                .selector
        );

        vm.prank(USER);
        cryptoRecurringWallet.removeOperators(0);
    }

    function testWalletContracts() public {
        address _dex = address(CONTRACT);

        // testing `addContracts` function
        vm.prank(USER);
        cryptoRecurringWallet.addContracts(_dex);
        assert(cryptoRecurringWallet.getContractsLength() == 1);
        assert(cryptoRecurringWallet.getContract(0) == _dex);

        // testing `removeContracts` function
        vm.prank(USER);
        cryptoRecurringWallet.removeContracts(0);
        assert(cryptoRecurringWallet.getContractsLength() == 0);

        // testing `setContracts` function
        vm.prank(USER);
        address[] memory operators = new address[](1);
        operators[0] = _dex;
        cryptoRecurringWallet.setContracts(operators);
        assert(cryptoRecurringWallet.getContractsLength() == 1);
        assert(cryptoRecurringWallet.getContract(0) == _dex);
    }

    function testWalletContractsFailed() public {
        vm.expectRevert(
            CryptoRecurringWallet
                .CryptoRecurringWallet__InvalidContractIndex
                .selector
        );

        vm.prank(USER);
        cryptoRecurringWallet.removeContracts(0);
    }

    function testWalletTokens() public {
        // setup token
        address _token = address(token);

        // testing `addTokens` function
        vm.prank(USER);
        cryptoRecurringWallet.addTokens(_token);
        assert(cryptoRecurringWallet.getTokensLength() == 1);
        assert(cryptoRecurringWallet.getToken(0) == _token);

        // testing `removeTokens` function
        vm.prank(USER);
        cryptoRecurringWallet.removeTokens(0);
        assert(cryptoRecurringWallet.getTokensLength() == 0);

        // testing `setTokens` function
        vm.prank(USER);
        address[] memory tokens = new address[](1);
        tokens[0] = _token;
        cryptoRecurringWallet.setTokens(tokens);
        assert(cryptoRecurringWallet.getTokensLength() == 1);
        assert(cryptoRecurringWallet.getToken(0) == _token);
    }

    function testWalletTokensFailed() public {
        vm.expectRevert(
            CryptoRecurringWallet
                .CryptoRecurringWallet__InvalidTokenIndex
                .selector
        );

        vm.prank(USER);
        cryptoRecurringWallet.removeTokens(0);
    }

    function testWithdrawEthers() public {
        uint256 userBalanceBefore = address(USER).balance;

        vm.prank(USER);
        (bool success, ) = address(cryptoRecurringWallet).call{
            value: 0.1 ether
        }("");
        assert(success);

        uint256 userBalanceAfter = address(USER).balance;

        vm.prank(USER);
        cryptoRecurringWallet.withdrawEther(0.1 ether);
        assert(userBalanceBefore == userBalanceAfter + 0.1 ether);
    }

    function testWithdrawEthersFailed() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                CryptoRecurringWallet
                    .CryptoRecurringWallet__FailedWithdrawEther
                    .selector,
                0.1 ether
            )
        );

        vm.prank(USER);
        cryptoRecurringWallet.withdrawEther(0.1 ether);
    }

    function testWithdrawTokens() public {
        uint256 userBalanceBefore = token.balanceOf(USER);

        vm.prank(USER);
        token.transfer(address(cryptoRecurringWallet), 0.1 ether);

        uint256 userBalanceAfter = token.balanceOf(USER);

        vm.prank(USER);
        cryptoRecurringWallet.withdrawToken(address(token), 0.1 ether);
        assert(userBalanceBefore == userBalanceAfter + 0.1 ether);
    }

    function testWithdrawTokensFailed() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC20Errors.ERC20InsufficientBalance.selector,
                address(cryptoRecurringWallet),
                0,
                0.1 ether
            )
        );

        vm.prank(USER);
        cryptoRecurringWallet.withdrawToken(address(token), 0.1 ether);
    }

    function testExecuteTx() public {
        // TODO: write test script for `executeTx` function
    }
}
