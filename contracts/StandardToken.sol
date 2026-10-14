// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract StandardToken is ERC20, ERC20Burnable {
    error ZeroAddress();
    error ZeroSupply();

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        address recipient_
    ) ERC20(name_, symbol_) {
        if (recipient_ == address(0)) revert ZeroAddress();
        if (totalSupply_ == 0) revert ZeroSupply();
        _mint(recipient_, totalSupply_ * 10 ** decimals());
    }
}
