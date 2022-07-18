// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Bank is Ownable {
    IERC20 public erc20Token;

    uint256 public t;
    uint256 public t0;

    uint256 public rewardPool;
    uint256[3] public rewardPools;

    uint256 public totalDeposit;
    mapping(address => uint256) public deposits;

    event RewardSupplied(uint256 value);
    event Deposit(address sender, uint256 value);
    event Withdrawal(address sender, uint256 value, uint256 reward);

    constructor(uint256 _t, IERC20 _erc20Token) Ownable() {
        erc20Token = _erc20Token;
        t0 = block.timestamp;
        t = _t; // 1 == 1 seconds
    }

    modifier depositPeriod {
        require(block.timestamp <= t0 + t, "Deposit period has ended");
        _;
    }

    modifier withdrawPeriod {
        require(block.timestamp > t0 + 2 * t, "Withdraw period has not started");
        _;
    }

    function round() public view returns (uint8) {
        require(block.timestamp > t0 + 2 * t, "Rounds not yet started");

        if (block.timestamp > t0 + 4 * t) {
            return 2;
        } else if (block.timestamp > t0 + 3 * t) {
            return 1;
        } else  {
            return 0;
        }
    }

    function supplyReward(uint256 value) external onlyOwner returns (bool) {
        erc20Token.transferFrom(msg.sender, address(this), value);
        rewardPool += value;

        uint256 pool1 = _calculateReward(value, 20);
        uint256 pool2 = _calculateReward(value, 30);
        uint256 pool3 = _calculateReward(value, 50);

        rewardPools[0] = pool1;
        rewardPools[1] = pool2;
        rewardPools[2] = pool3;

        rewardPools[2] += value - (pool1 + pool2 + pool3);

        emit RewardSupplied(value);

        return true;
    }

    function _takeTotalReward(address user) private returns (uint256) {
        uint256 reward;
        uint8 r = round();
        // 0. get round
        // 1. calculate percent of deposit
        // 2. calculate percent of each reward pool
        // 3. sum rewards
        uint256 depositPercent = _calculatePercent(deposits[user], totalDeposit);

        for (uint8 i = 0; i <= r; i++) {
            uint256 poolReward = _calculateReward(rewardPools[i], depositPercent);
            rewardPools[i] -= poolReward;
            reward += poolReward;
        }

        return reward;
    }

    function _calculateReward(uint256 pool, uint256 percent) private pure returns (uint256) {
        return (pool * percent) / 100;
    }

    function _calculatePercent(uint256 part, uint256 total) private pure returns (uint256) {
        return (part * 100) / total;
    }

    function withdraw() external withdrawPeriod returns (bool) {
        uint256 value = deposits[msg.sender];
        uint256 userReward = _takeTotalReward(msg.sender);

        deposits[msg.sender] = 0;
        totalDeposit -= value;
        rewardPool -= userReward;

        erc20Token.transfer(msg.sender, value + userReward);
        emit Withdrawal(msg.sender, value, userReward);

        return true;
    }

    function deposit(uint256 value) external depositPeriod returns (bool) {
        erc20Token.transferFrom(msg.sender, address(this), value);

        deposits[msg.sender] += value;
        totalDeposit += value;
        emit Deposit(msg.sender, value);

        return true;
    }
}
