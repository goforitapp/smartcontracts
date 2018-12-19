pragma solidity 0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";

/// @title GoForItToken
/// @author Sicos et al.
contract GoForItToken is MintableToken, PausableToken, BurnableToken {

    string public name = "Goin Token";
    string public symbol = "GOI";
    uint8 public decimals = 18;

    /// @dev Constructor
    constructor() public {
        pause();
    }

}
