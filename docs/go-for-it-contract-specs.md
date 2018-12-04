Token Contract
===========

The token contract implements a ERC20 standard token. It is named "Goin Token".
Ticker symbol will be GOI.
The number of decimals will be 18 to keep the resolution identical to ETH.

The token contract emits the standard ERC20 events including a transfer event to address 0x0 in case of minting tokens.

We rely on the broadly trusted Open Zeppelin v1.12.0 implementation of an ERC20 compliant Token. The following extensions are used:


Capped and Mintable
-------------------

Tokens are minted on demand by the Crowdsale contract.
Therefore the ownership of the token contract has to be transferred to the token sale contract. The minting of tokens is capped at 12,500,000,000.

Pausable
--------

Transfer of tokens is paused on construction of the token contract.
Transfer of tokens is unpaused on finalization of the token sale
contract.
No transfer of tokens is possible until finalization of the token sale.

Burnable
--------
The token will not be burnable.

Owned
-----

Minting and pausing functions are restricted to the token contract owner. The ownership of the token contract is transferred to the Crowdsale contract immediately after deployment.
The ownership of the token contract remains with the Crowdsale contract after finalization, so the Token will not be pausable or mintable after finalization.


Token Sale Contract
===================

The Token sale contract is a Minted and Finalizable Crowd sale from the Open Zeppelin framework (v1.12.0).

Post KYC crowd sale
-------------------

The token sale contract uses a new scheme for KYC verification. Every investor is able to invest ETH into the crowd sale but tokens are only minted after the KYC of the sending address is verified.
If an unverified investor sends ETH, tokens are not minted but the amount of pending tokens will be stored and issued when the address is verified by the owner of the token sale contract as long as the token cap of the sale is not exceeded.
The verification should process multiple addresses in one transaction.
Once an address is verified it can invest and the token purchase will be processed instantly. Investors who send ETH and do not provide KYC information or investors that do not meet KYC requirements, can withdraw their investment after finalization of the crowd sale.


Set Rate
--------

The token sale contract provides a function that enables the token
contract owner to set the Token price at any time.
The price represents the Token per ETH rate. With a target
price of 0.0004 € per Token we will have a rate of
approximately 250,000 according to a price of approximately 100 € per ETH.
There is a sanity check, that allows to change the rate only by one order of magnitude up or down.


Token pools
-----------

  |Pool            |           Cap |distribution time                               |
  |----------------|---------------|------------------------------------------------|
  |private sale    | 5,511,842,425 | at finalization into presale vesting contract  |
  |public sale     | 1,250,000,000 | between start and end date of Crowdsale        |
  |Bounty          |   181,250,000 | at finalization to company wallet              |
  |Team            | 1,100,000,000 | at finalization into vesting contract 24 month |
  |Company         | 3,369,407,575 | at finalization into vesting contract 12 month |
  |Advisors        | 1,087,500,000 | The advisor share is split into two parts      |
  |Advisors 25%    |   271,875,000 | at finalization to company wallet              |
  |Advisors 75%    |   815,625,000 | at finalization into vesting contract 24 month |              
  |Token Cap       |12,500,000,000 |                                                |


KYC verification
----------------

After the end of the Crowdsale investors have time to pass the KYC requirements until the finalization function is  called.


Finalization
------------
Company tokens will be minted to a vesting contract that will release the token after 12 month. 25% of Advisor  tokens will be minted to the company MultiSig wallet. 75% of Advisor tokens and the Team  tokens will be minted to to a vesting contract that will release the token after 24 month. Bounty tokens will be minted to the company wallet, for distribution to bounty recipients.
Further minting of tokens in token contract is disabled.
Transfers are unpaused in token contract.
The ownership of the token contract is not transferred. The token sale contract is useless from now on.
The token contract has no owner capable of acting, which means the token is not pausable.
It is possible to prolong the KYC period by waiting with the call of the finalization function.
The finalization function can only be called once successfully.

MultiSignature Wallets
======================
The Company wallet will be a Multisignature contracts. For the MultiSig wallet we will use the latest version of the Gnosis (ConsenSys) Multisignature Wallets (https://github.com/gnosis/MultiSigWallet)

The following requirements have to be fulfilled for deployment of the MultiSig wallet.


|Requirement                | Source  |       Value                              |
|---------------------------|---------|------------------------------------------|
|Name of Token              | GoForIt | Goin Token                               |
|Symbol of Token            | GoForIt | GOI                                      |
|Prize of Token             | GoForIt | 0,0004 €                                 |

Vesting contracts
=================
There will be 3 Vesting contracts.

The Team and Advisor vesting contract will have a vesting period of 24 month and hold 75% of the Advisor tokens and all the Team tokens. The beneficiary of the vesting contract will be the company wallet.
The company vesting contract will have a vesting period of 12 month and hold all the Company tokens. The beneficiary of the vesting contract will be the company wallet.
The presale vesting contract will have a vesting period of 12 month and hold all presale token. The owner of the vesting contract can enter the beneficiaries and amount of the investors that participated in the presale. After the end of the vesting period the beneficiaries can call a function to withdraw their tokens from the vesting contract.

Project Timeline
================


  |Date                  | Event                                             |
  |----------------------|---------------------------------------------------|
  |           201?-??-?? | Token contract deployment                         |
  |                      | Bounty contract deployment                        |
  |                      | Token sale contract deployment                    |
  |                      | Transfer of token ownership to token sale contract|
  |                      | deployment of                                     |
  |                      | Etherscan code verification                       |
  |                      | Deployment of vesting and multisignature contract |
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
|Opening time of Crowdsale  | GoForIt |                                          |
|Closing time of Crowdsale  | GoForIt |                                          |
|Owner of Crowdsale contract| GoForIt |0x????????????????????????????????????????|
|Owner of vesting contracts | GoForIt |0x????????????????????????????????????????|


Deployment method
-----------------

The contracts will be deployed manually, using remixd and mist on a synchronized full node.
