Abstract
========

Technical specifications for the smart contracts of the GoForIt Crowdsale.


Token Contract
===========

The token contract implements an ERC20 standard token. It is named "Goin Token".
The ticker symbol will be GOI.
The number of decimals will be 18 to keep the resolution identical to ETH.
We rely on the broadly trusted Open Zeppelin v1.12.0 implementation of an ERC20 compliant Token. The following extensions are used:

Mintable
--------

Tokens are minted on demand by the Crowdsale contract.
Therefore the ownership of the token contract will be transferred to the token sale contract after deployment.
The token contract emits the standard ERC20 events including a transfer event to address 0x0 in case of minting tokens.

Pausable
--------

Transfer of tokens is paused on construction of the token contract.
Transfer of tokens is unpaused on finalization of the token sale
contract.
No transfer of tokens is possible before finalization of the token sale.

Burnable
--------
The token will not be burnable.

Owned
-----

Minting and pausing functions are restricted to the token contract owner. The ownership of the token contract is transferred to the Crowdsale contract immediately after deployment.
The ownership of the token contract remains with the Crowdsale contract after finalization, so the Token will not be pausable or mintable after finalization.


Crowdsale Contract
===================

The Crowdsale contract is a Minted and Finalizable Crowd sale from the Open Zeppelin framework (v1.12.0).

Token pools
-----------

The crowdsale is divided into different pools.
The minting of tokens is capped at 12,500,000,000. by the crowdsale contract.

  |Pool            |           Cap |distribution time                               |
  |----------------|---------------|------------------------------------------------|
  |private sale    | 5,511,842,425 | at finalization into vesting contract 12 month |
  |public sale     | 1,250,000,000 | between start and end date of Crowdsale        |
  |Bounty          |   181,250,000 | at finalization to company wallet              |
  |Team            | 1,100,000,000 | at finalization into vesting contract 24 month |
  |Company         | 3,369,407,575 | at finalization into vesting contract 12 month |
  |Advisors        | 1,087,500,000 | The advisor pool is split into two parts       |
  |Advisors 25%    |   271,875,000 | at finalization to company wallet              |
  |Advisors 75%    |   815,625,000 | at finalization into vesting contract 24 month |              
  |Total Cap       |12,500,000,000 |                                                |

Post KYC crowd sale
-------------------

The token sale contract uses a new scheme for KYC verification for investors in the public sale. Every investor is able to invest ETH into the crowdsale but tokens are only minted after the KYC of the sending address is verified.
If an unverified investor sends ETH, tokens are not minted but the number of pending tokens will be stored and issued when the address is verified by the owner of the token sale contract as long as the token cap of the sale is not exceeded.
The verification is done by the owner of the crowdsale contract.
The verification function should process multiple addresses in one transaction.
Once an address is verified it can invest and the token purchase will be processed instantly. Investors who send ETH and do not get verified or investors that do not meet KYC requirements can withdraw their investment after the end of the crowd sale.

After the end of the Crowdsale investors have time to pass the KYC requirements until the finalization function is called.

Set Rate
--------

The token sale contract provides a function that enables the token
contract owner to set the Token price at any time.
The price represents the Token per ETH rate. With a target
price of 0.0004 € per Token we will have a rate of
approximately 250,000 according to a price of approximately 100 € per ETH.
There is a sanity check, that allows to changing the rate only by one order of magnitude up or down.


Finalization
------------

Two vesting contracts will be created. One with 12 months and one with 24 month vesting period.
Company tokens will be minted to the oneYearVesting contract, that will release the token after 12 months.
Presale tokens will be minted to the oneYearVesting contract, that will release the token after 12 months.

25% of Advisor tokens will be minted to the company MultiSig wallet.
75% of Advisor tokens will be minted to the 24 months vesting contract.
Team  tokens will be minted to the 24 month vesting contract.
Bounty tokens will be minted to the company wallet, for distribution to bounty recipients.
Further minting of tokens in the token contract is disabled.
Transfers are unpaused in the token contract.
The ownership of the token contract is not transferred. The token sale contract is useless from now on.
The token contract has no owner capable of acting, which means the token is not pausable.
It is possible to prolong the KYC period by waiting with the call of the finalization function.
The finalization function can only be called once successfully.


MultiSignature Wallets
======================
The Company wallet will be a Multisignature contracts. For the MultiSig wallet we will use the latest version of the Gnosis (ConsenSys) Multisignature Wallets (https://github.com/gnosis/MultiSigWallet)

There will be a second MultiSig wallet for the collection of the funds of the presale.

The following requirements have to be fulfilled for deployment of the MultiSig wallets.

|Requirement                                      | Source  |       Value               |
|-------------------------------------------------|---------|---------------------------|
|Number of addresses in the MultiSig wallet       | GoForIt |                           |
|Number of verifications to confirm transactions  | GoForIt |                           |
|List of owner addresses of the MultiSig wallet   | GoForIt |                           |


Token vesting contract
======================
There will be 2 Vesting contracts one for a vesting period of 1 year and one for a period of two years.
The vesting contracts will be deployed by the crowdsale during finalization.
The owner of a vesting contract can enter the beneficiaries and amount of the beneficiary.
After the end of the vesting period, the beneficiaries can call a function to withdraw their tokens from the vesting contract.
There will be a function to withdraw the token for any beneficiary that can be called by the owner.
There will be a function to retrieve tokens that allows the owner to withdraw any tokens that are not withdrawn by the beneficiary after one year.

The one-year vesting contract will hold all the presale investors token and company tokens.
The two-year vesting contract will hold 75% of the Advisor tokens and all the Team tokens.


Project Timeline
================


  |Date                  | Event                                             |
  |----------------------|---------------------------------------------------|
  |                      | Multisig contract deployment                      |
  |           201?-??-?? | Token contract deployment                         |
  |                      | Token sale contract deployment                    |
  |                      | Transfer of token ownership to token sale contract|
  |                      | deployment of                                     |
  |                      | Etherscan code verification                       |
  |           201?-??-?? | Start of Crowdsale                                |
  |           201?-??-?? | End of Crowdsale                                  |
  |           201?-??-?? | Finalization                                      |


Deployment Requirements
=======================

The following requirements have to be fulfilled at deployment time


|Requirement                | Source  |       Value                              |
|---------------------------|---------|------------------------------------------|
|Name of Token              | GoForIt | Goin Token                               |
|Symbol of Token            | GoForIt | GOI                                      |
|Prize of Token             | GoForIt | 0,0004 €                                 |
|Opening time of Crowdsale  | GoForIt | ?                                        |
|Closing time of Crowdsale  | GoForIt | ?                                        |
|Owner of Crowdsale contract| GoForIt |0x????????????????????????????????????????|
|Owner of vesting contracts | GoForIt |0x????????????????????????????????????????|



Deployment method
-----------------

The contracts will be deployed manually, using remixd and mist on a synchronized full node.
