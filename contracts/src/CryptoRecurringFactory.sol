// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {CryptoRecurringWallet} from "./CryptoRecurringWallet.sol";

contract CryptoRecurringFactory is Ownable2Step {
    address[] private s_wallets;
    mapping(address => address[]) private s_userWallets;

    event GenerateWallet(address indexed wallet);

    constructor() Ownable(msg.sender) {}

    function createWallet(
        address _user,
        address[] calldata _operators,
        address[] calldata _tokens,
        address[] calldata _contracts
    ) external {
        address wallet = address(
            new CryptoRecurringWallet(_user, _operators, _tokens, _contracts)
        );
        s_wallets.push(wallet);
        s_userWallets[_user].push(wallet); // Store wallet under the user's address
        emit GenerateWallet(wallet);
    }

    function getWalletLength() public view returns (uint256) {
        return s_wallets.length;
    }

    function getWallet(uint256 index) public view returns (address) {
        return s_wallets[index];
    }

    function getUserWallets(
        address user
    ) public view returns (address[] memory) {
        return s_userWallets[user]; // Return the list of wallets associated with the user
    }
}
