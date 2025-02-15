// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {CryptoRecurringFactory} from "src/CryptoRecurringFactory.sol";

contract CryptoRecurringFactoryTest is Test {
    CryptoRecurringFactory public cryptoRecurringFactory;

    address public DEPLOYER = makeAddr("deployer");
    address public USER = makeAddr("user");

    function setUp() external {
        vm.startBroadcast();
        cryptoRecurringFactory = new CryptoRecurringFactory();
        vm.stopBroadcast();
    }

    function testFactoryCreateWallet() public {
        cryptoRecurringFactory.createWallet(
            USER,
            new address[](0),
            new address[](0),
            new address[](0)
        );
        assert(cryptoRecurringFactory.getWalletLength() == 1);
        assert(cryptoRecurringFactory.getWallet(0) != address(0));
    }
}
