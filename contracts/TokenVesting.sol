pragma solidity 0.4.24;

import "./GoForItToken.sol";


/// @title  Token vesting contract
/// @author Sicos et al.
contract TokenVesting is Ownable {

    uint256 public endOfVestingPeriod;  // the block time from which tokens can be withdrawn

    uint256 public totalAllocation;
    mapping (address => uint256) public allocations;

    GoForItToken public token;

    /// Log event on token allocation
    event Allocation(address indexed beneficiary, uint amount);

    /// Log event on token withdrawal
    event Withdrawal(address indexed beneficiary, uint amount);

    /// @dev constructor
    /// @param _token Token contract address for GoForIt token
    /// @param _endOfVestingPeriod Block timestamp (Unix epoch) when tokens become unlocked
    constructor(GoForItToken _token, uint _endOfVestingPeriod) public {
        token = _token;
        endOfVestingPeriod = _endOfVestingPeriod;
    }

    /// @dev Allow to selfdestruct contract and sending remaining tokens to owner
    ///      if presale investors didn't withdraw within one year.
    function destruct() public onlyOwner {
        require(now >= endOfVestingPeriod + 365 days, "Destruction not possible yet");

        uint256 balance = token.balanceOf(this);

        if (balance > 0) {
            token.transfer(owner, balance);
        }

        selfdestruct(owner);
    }

    /// @dev Allocates tokens to presale investors
    /// @param _beneficiaries Addresses of founders
    /// @param _amounts Numbers of tokens allocated to each founder
    function allocate(address[] _beneficiaries, uint[] _amounts) public onlyOwner {
        require(_beneficiaries.length == _amounts.length, "Given array lengths differ");

        for (uint i = 0; i < _beneficiaries.length; ++i) {
            // No need for SafeMath here.
            totalAllocation = totalAllocation + _amounts[i] - allocations[_beneficiaries[i]];
            allocations[_beneficiaries[i]] = _amounts[i];

            emit Allocation(_beneficiaries[i], _amounts[i]);
        }

        require(totalAllocation <= token.balanceOf(this), "Allocation exceeds balance");
    }

    /// @dev Allow founders to withdraw tokens that were allocated for them
    function withdraw() public {
        _withdraw(msg.sender);
    }

    /// @dev Allow the owner to withdraw allocated tokens for the benefit of founders
    /// @param _beneficiaries List of founder addresses
    function withdrawFor(address[] _beneficiaries) public onlyOwner {
        for (uint i = 0; i < _beneficiaries.length; ++i) {
            _withdraw(_beneficiaries[i]);
        }
    }

    /// @dev Internal withdraw function
    /// @param _beneficiary Address of a founder
    function _withdraw(address _beneficiary) internal {
        require(now >= endOfVestingPeriod, "Tokens are still locked");

        uint amount = allocations[_beneficiary];

        if (amount > 0) {
            allocations[_beneficiary] = 0;
            totalAllocation -= amount;  // No need for SafeMath here.

            require(token.transfer(_beneficiary, amount), "Token transfer failed");

            emit Withdrawal(_beneficiary, amount);
        }
    }

}
