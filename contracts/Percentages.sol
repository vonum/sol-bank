// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.15;

library Percentages {
    function percentValue(uint256 total, uint256 percentage) internal pure returns (uint256) {
        return (total * percentage) / 100;
    }

    function percent(uint256 part, uint256 total) internal pure returns (uint256) {
        return (part * 100) / total;
    }
}
