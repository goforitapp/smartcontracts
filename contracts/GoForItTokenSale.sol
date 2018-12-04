pragma solidity 0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "./PostKYCCrowdsale.sol";
import "./TokenVesting.sol";
import "./GoForItToken.sol";


/// @title GoForItTokenSale
/// @author Sicos et al.
contract GoForItTokenSale is PostKYCCrowdsale, MintedCrowdsale {

    // Maxmimum number of tokens sold
    uint public constant TOTAL_TOKEN_CAP_OF_SALE =  1250000000e18;  // = 1.250.000.000 e18
    uint public constant TOTAL_TOKEN_CAP         = 12500000000e18;  // =12.500.000.000 e18

    // Extra tokens minted upon finalization
    uint public constant TOKEN_SHARE_OF_PRESALE  =  5511842425e18;  // =  5.511.842.425 e18
    uint public constant TOKEN_SHARE_OF_TEAM     =  1100000000e18;  // =  1.100.000.000 e18
    uint public constant TOKEN_SHARE_OF_ADVISORS =  1087500000e18;  // =  1.087.500.000 e18
    uint public constant TOKEN_SHARE_OF_COMPANY  =  3369407575e18;  // =  3.369.407.575 e18
    uint public constant TOKEN_SHARE_OF_BOUNTY   =   181250000e18;  // =    181.250.000 e18

    // Date/time constants
    uint public constant SALE_OPENING_TIME     = 1600000000;  // 201X-00-00 00:00:00 CEST
    uint public constant SALE_CLOSING_TIME     = 2000000000;  // 201X-00-00 00:00:00 CEST

    // addresses token shares are minted to in finalization
    TokenVesting public oneYearVesting;
    TokenVesting public twoYearVesting;

    // Amount of token available for purchase
    uint public remainingTokensForSale;

    /// @dev Log entry on rate changed
    /// @param newRate the new rate
    event RateChanged(uint newRate);

    /// @dev Constructor
    /// @param _token A GoForItToken
    /// @param _rate the initial rate.
    /// @param _wallet MultiSig wallet address the ETH is forwarded to.
    constructor(
        GoForItToken _token,
        uint _rate,
        address _wallet
    )
        public
        Crowdsale(_rate, _wallet, _token)
        TimedCrowdsale(SALE_OPENING_TIME, SALE_CLOSING_TIME)
    {
        remainingTokensForSale = TOTAL_TOKEN_CAP_OF_SALE;
    }

    /// @dev Set rate
    /// @param _newRate the new rate
    function setRate(uint _newRate) public onlyOwner {
        // A rate change by a magnitude order of ten and above is rather a typo than intention.
        // If it was indeed desired, several setRate transactions have to be sent.
        require(rate / 10 < _newRate && _newRate < 10 * rate);

        rate = _newRate;

        emit RateChanged(_newRate);
    }

    /// @dev unverified investors can withdraw their money only after the GoForIt Sale ended
    function withdrawInvestment() public {
        require(hasClosed());

        super.withdrawInvestment();
    }


    /// @dev Is the GoForIt main sale ongoing?
    /// @return bool
    function GoForItSaleOngoing() public view returns (bool) {
        return SALE_OPENING_TIME <= now && now <= SALE_CLOSING_TIME;
    }

    /// @dev Deliver tokens
    /// @param _beneficiary an investors Ethereum address
    /// @param _tokenAmount token amount to deliver
    function _deliverTokens(address _beneficiary, uint _tokenAmount) internal {
        require(remainingTokensForSale >= _tokenAmount);
        remainingTokensForSale = remainingTokensForSale.sub(_tokenAmount);

        super._deliverTokens(_beneficiary, _tokenAmount);
    }

    /// @dev Finalization
    function finalization() internal {
        require(hasClosed());

        oneYearVesting = new TokenVesting(GoForItToken(token), now + 365 days);
        oneYearVesting.transferOwnership(owner);
        GoForItToken(token).mint(oneYearVesting, TOKEN_SHARE_OF_COMPANY);
        GoForItToken(token).mint(oneYearVesting, TOKEN_SHARE_OF_PRESALE);

        twoYearVesting = new TokenVesting(GoForItToken(token), now + 730 days);  // = 2 yrs
        twoYearVesting.transferOwnership(owner);
        GoForItToken(token).mint(twoYearVesting, TOKEN_SHARE_OF_ADVISORS);
        GoForItToken(token).mint(twoYearVesting, (TOKEN_SHARE_OF_TEAM *75)/100);  // = 75%


        GoForItToken(token).mint(wallet, (TOKEN_SHARE_OF_TEAM  *25)/100);
        GoForItToken(token).mint(wallet, TOKEN_SHARE_OF_BOUNTY);

        GoForItToken(token).finishMinting();
        GoForItToken(token).unpause();

        super.finalization();
    }

}
