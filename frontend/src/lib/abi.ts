export const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function mint(address,uint256)",
];

export const PRESALE_ABI = [
  "function token() view returns (address)", "function usdt() view returns (address)", "function treasury() view returns (address)",
  "function owner() view returns (address)", "function price() view returns (uint256)", "function saleCap() view returns (uint256)",
  "function totalSold() view returns (uint256)", "function totalRaised() view returns (uint256)", "function minBuy() view returns (uint256)",
  "function maxPerWallet() view returns (uint256)", "function startTime() view returns (uint256)", "function endTime() view returns (uint256)",
  "function paused() view returns (bool)", "function contributed(address) view returns (uint256)",
  "function tokensForUsdt(uint256) view returns (uint256)", "function tokensRemaining() view returns (uint256)",
  "function buy(uint256,uint256) returns (uint256)", "function pause()", "function unpause()", "function setPrice(uint256)",
  "function setTreasury(address)", "function setLimits(uint256,uint256)", "function setSaleWindow(uint256,uint256)",
  "function withdrawUnsold(address,uint256)",
  "error ZeroAddress()", "error ZeroValue()", "error InvalidWindow()", "error InvalidLimits()", "error SaleNotActive()",
  "error SaleNotEnded()", "error BelowMinBuy()", "error WalletLimitExceeded()", "error SaleCapExceeded()", "error SlippageTooHigh()",
  "error CannotRescueSaleToken()", "error RenounceDisabled()", "error EnforcedPause()", "error ExpectedPause()",
  "error ReentrancyGuardReentrantCall()", "error OwnableUnauthorizedAccount(address account)",
  "error ERC20InsufficientAllowance(address spender,uint256 allowance,uint256 needed)",
  "error ERC20InsufficientBalance(address sender,uint256 balance,uint256 needed)", "error SafeERC20FailedOperation(address token)",
];
