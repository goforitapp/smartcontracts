pragma solidity 0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "./PostKYCCrowdsale.sol";
import "./GoForItToken.sol";


/// @title GoForItTokenSale
/// @author Sicos et al.
contract GoForItTokenSale is PostKYCCrowdsale, MintedCrowdsale {

    // Maxmimum number of tokens sold
    uint public constant TOTAL_TOKEN_CAP_OF_SALE = 1250000000e18;  // = 1.250.000.000 e18

    // Extra tokens minted upon finalization
    uint public constant TOKEN_SHARE_OF_TEAM     =  1100000000e18;  // =  1.100.000.000 e18
    uint public constant TOKEN_SHARE_OF_ADVISORS =  1087500000e18;  // =  1.087.500.000 e18
    uint public constant TOKEN_SHARE_OF_COMPANY   =  3369407575e18;  // =  3.369.407.575 e18
    uint public constant TOKEN_SHARE_OF_BOUNTY   =   181250000e18;  // =    181.250.000 e18

    // Date/time constants
    uint public constant SALE_OPENING_TIME     = 1000000000;  // 201X-00-00 00:00:00 CEST
    uint public constant SALE_CLOSING_TIME     = 2000000000;  // 201X-00-00 00:00:00 CEST

    // addresses token shares are minted to in finalization
    address public teamAddress;
    address public advisorsAddress;
    address public companyAddress;
    address public bountyAddress;

    // Amount of token available for purchase
    uint public remainingTokensForSale;

    /// @dev Log entry on rate changed
    /// @param newRate the new rate
    event RateChanged(uint newRate);

    /// @dev Constructor
    /// @param _token A GoForItToken
    /// @param _rate the initial rate.
    /// @param _teamAddress Ethereum address of Team
    /// @param _advisorsAddress Ethereum address of Advisors
    /// @param _companyAddress Ethereum address of company
    /// @param _bountyAddress A GoForItTokenBounty
    /// @param _wallet MultiSig wallet address the ETH is forwarded to.
    constructor(
        GoForItToken _token,
        uint _rate,
        address _teamAddress,
        address _advisorsAddress,
        address _companyAddress,
        address _bountyAddress,
        address _wallet
    )
        public
        Crowdsale(_rate, _wallet, _token)
        TimedCrowdsale(SALE_OPENING_TIME, SALE_CLOSING_TIME)
    {
        // Token sanity check
        require(_token.cap() >= TOTAL_TOKEN_CAP_OF_SALE
                                + TOKEN_SHARE_OF_TEAM
                                + TOKEN_SHARE_OF_ADVISORS
                                + TOKEN_SHARE_OF_COMPANY
                                + TOKEN_SHARE_OF_BOUNTY);

        // Sanity check of addresses
        require(_teamAddress != address(0)
                && _advisorsAddress != address(0)
                && _companyAddress != address(0)
                && _bountyAddress != address(0));


        teamAddress = _teamAddress;
        advisorsAddress = _advisorsAddress;
        companyAddress = _companyAddress;
        bountyAddress = _bountyAddress;

        remainingTokensForSale = TOTAL_TOKEN_CAP_OF_SALE;
    }

    /// @dev Distribute presale
    /// @param _investors  list of investor addresses
    /// @param _amounts  list of token amounts purchased by investors
    function distributePresale(address[] _investors, uint[] _amounts) public onlyOwner {
        require(!hasClosed());
        require(_investors.length == _amounts.length);

        uint totalAmount = 0;

        for (uint i = 0; i < _investors.length; ++i) {
            GoForItToken(token).mint(_investors[i], _amounts[i]);
            totalAmount = totalAmount.add(_amounts[i]);
        }

        require(remainingTokensForSale >= totalAmount);
        remainingTokensForSale = remainingTokensForSale.sub(totalAmount);
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

        GoForItToken(token).mint(teamAddress, TOKEN_SHARE_OF_TEAM);
        GoForItToken(token).mint(advisorsAddress, TOKEN_SHARE_OF_ADVISORS);
        GoForItToken(token).mint(companyAddress, TOKEN_SHARE_OF_COMPANY);
        GoForItToken(token).mint(bountyAddress, TOKEN_SHARE_OF_BOUNTY);

        GoForItToken(token).finishMinting();
        GoForItToken(token).unpause();

        super.finalization();
    }

}
