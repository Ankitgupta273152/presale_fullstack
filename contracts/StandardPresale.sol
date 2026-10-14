// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StandardPresale is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    IERC20 public immutable usdt;
    uint256 public immutable tokenUnit;

    address public treasury;

    uint256 public price;
    uint256 public saleCap;
    uint256 public totalSold;
    uint256 public totalRaised;

    uint256 public minBuy;
    uint256 public maxPerWallet;

    uint256 public startTime;
    uint256 public endTime;

    mapping(address => uint256) public contributed;

    event TokensPurchased(address indexed buyer, uint256 usdtAmount, uint256 tokenAmount);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event LimitsUpdated(uint256 minBuy, uint256 maxPerWallet);
    event SaleWindowUpdated(uint256 startTime, uint256 endTime);
    event UnsoldWithdrawn(address indexed to, uint256 amount);
    event TokenRescued(address indexed token, address indexed to, uint256 amount);

    error ZeroAddress();
    error ZeroValue();
    error InvalidWindow();
    error InvalidLimits();
    error SaleNotActive();
    error SaleNotEnded();
    error BelowMinBuy();
    error WalletLimitExceeded();
    error SaleCapExceeded();
    error SlippageTooHigh();
    error CannotRescueSaleToken();
    error RenounceDisabled();

    constructor(
        address token_,
        address usdt_,
        address treasury_,
        uint256 price_,
        uint256 saleCap_,
        uint256 startTime_,
        uint256 endTime_,
        address owner_
    ) Ownable(owner_) {
        if (token_ == address(0) || usdt_ == address(0) || treasury_ == address(0)) revert ZeroAddress();
        if (price_ == 0 || saleCap_ == 0) revert ZeroValue();
        if (startTime_ >= endTime_) revert InvalidWindow();

        token = IERC20(token_);
        usdt = IERC20(usdt_);
        tokenUnit = 10 ** uint256(IERC20Metadata(token_).decimals());
        treasury = treasury_;
        price = price_;
        saleCap = saleCap_;
        startTime = startTime_;
        endTime = endTime_;
    }

    function buy(uint256 usdtAmount, uint256 minTokensOut)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 tokensOut)
    {
        if (block.timestamp < startTime || block.timestamp > endTime) revert SaleNotActive();
        if (usdtAmount == 0 || usdtAmount < minBuy) revert BelowMinBuy();

        tokensOut = (usdtAmount * tokenUnit) / price;
        if (tokensOut == 0 || tokensOut < minTokensOut) revert SlippageTooHigh();

        if (maxPerWallet != 0 && contributed[msg.sender] + usdtAmount > maxPerWallet) {
            revert WalletLimitExceeded();
        }
        if (totalSold + tokensOut > saleCap) revert SaleCapExceeded();

        contributed[msg.sender] += usdtAmount;
        totalSold += tokensOut;
        totalRaised += usdtAmount;

        usdt.safeTransferFrom(msg.sender, treasury, usdtAmount);
        token.safeTransfer(msg.sender, tokensOut);

        emit TokensPurchased(msg.sender, usdtAmount, tokensOut);
    }

    function tokensForUsdt(uint256 usdtAmount) external view returns (uint256) {
        return (usdtAmount * tokenUnit) / price;
    }

    function tokensRemaining() external view returns (uint256) {
        return saleCap - totalSold;
    }

    function setPrice(uint256 newPrice) external onlyOwner whenPaused {
        if (newPrice == 0) revert ZeroValue();
        emit PriceUpdated(price, newPrice);
        price = newPrice;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setLimits(uint256 minBuy_, uint256 maxPerWallet_) external onlyOwner {
        if (maxPerWallet_ != 0 && maxPerWallet_ < minBuy_) revert InvalidLimits();
        minBuy = minBuy_;
        maxPerWallet = maxPerWallet_;
        emit LimitsUpdated(minBuy_, maxPerWallet_);
    }

    function setSaleWindow(uint256 startTime_, uint256 endTime_) external onlyOwner {
        if (startTime_ >= endTime_) revert InvalidWindow();
        startTime = startTime_;
        endTime = endTime_;
        emit SaleWindowUpdated(startTime_, endTime_);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdrawUnsold(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (block.timestamp <= endTime) revert SaleNotEnded();
        token.safeTransfer(to, amount);
        emit UnsoldWithdrawn(to, amount);
    }

    function rescueToken(address tokenAddress, address to, uint256 amount) external onlyOwner {
        if (tokenAddress == address(token)) revert CannotRescueSaleToken();
        if (tokenAddress == address(0) || to == address(0)) revert ZeroAddress();
        IERC20(tokenAddress).safeTransfer(to, amount);
        emit TokenRescued(tokenAddress, to, amount);
    }

    function renounceOwnership() public pure override {
        revert RenounceDisabled();
    }
}
