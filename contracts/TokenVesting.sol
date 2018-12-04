pragma solidity 0.4.24;

import './GoForItToken.sol';

/**
 * @title  Token vesting contract
 * @author Sicos et al.
 */

contract TokenVesting is Ownable {
    using SafeMath for uint;

    uint256 public endOfVestingPeriod;
    uint256 public allocatedTokens;
    mapping (address => uint256) public balances;

    GoForItToken public token;

    /**
     * @dev constructor
     * @param _token Token contract address for GoForIt token
     */
    constructor(GoForItToken _token, uint _endOfVestingPeriod) public {
        token = _token;
        endOfVestingPeriod = _endOfVestingPeriod;
    }

    /**
     * @dev Adds balances for presale investors
     * @param _investors Address of a founder
     * @param _balances Number of tokens allocated to a founder

     */
     function addBalance(address[] _investors, uint[] _balances) public onlyOwner {
         require(_investors.length== _balances.length);
         for (uint i = 0; i < _investors.length; ++i) {
             allocatedTokens -= balances[_investors[i]];
             balances[_investors[i]] = _balances[i];
             allocatedTokens += _balances[i];
         }
         require(allocatedTokens <= token.balanceOf(this));
     }


     function withdrawToken() public {
         _withdrawToken(msg.sender);
     }

     function withdrawTokensFor(address[] _beneficiaries) public onlyOwner {
         for (uint i = 0; i < _beneficiaries.length; ++i) {
         _withdrawToken(_beneficiaries[i]);
       }
     }




    function _withdrawToken(address _beneficiary) internal {
        require(now >= endOfVestingPeriod);

        uint tokensToTransfer = balances[_beneficiary];
        balances[_beneficiary] = 0;
        allocatedTokens -= tokensToTransfer;
        require(token.transfer(_beneficiary, tokensToTransfer));
    }

    /**
     * @dev allow to selfdestruct contract and sending remaining tokens to owner if presale investors didn't withdraw within one year.
     */
    function destruct() public onlyOwner {
        require(now >= endOfVestingPeriod.add(365 days));
        uint256 balance = token.balanceOf(this);

        if (balance > 0) {
            token.transfer(owner, balance);
        }

        selfdestruct(owner);
    }
}
