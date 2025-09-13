// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LoreBadge is ERC721URIStorage, Ownable {
  uint256 public nextTokenId;
  constructor() ERC721("JeremieLore", "LORE") {}

  function mintBadge(address to, string memory uri) external onlyOwner {
    _safeMint(to, nextTokenId);
    _setTokenURI(nextTokenId, uri);
    nextTokenId++;
  }
}
