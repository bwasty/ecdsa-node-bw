const { secp256k1 } = require("ethereum-cryptography/secp256k1")
const { keccak256 } = require("ethereum-cryptography/keccak")
const { utf8ToBytes, toHex } = require("ethereum-cryptography/utils")

const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "03519090ddc9c0bc7eb87e63e7641ac69678447a0000271763fec4567c3134c802": 100, // dan
  "02ff1573b199e3924b9d1332d8fdf2bc78e484b0500dc26b206a8d7fd8ecffae3a": 50, // al
  "03e04380564253fdbcd2537f2e0e8c92b28d1fedb046dc358169779ed611a72ace": 75, // ben
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { signature, sender, recipient, amount } = req.body;
  //const sender = secp256k1.recoverPublicKey(keccak256(utf8ToBytes(`{recipient}{amount}`)) , signature, true)
  const sig = new secp256k1.Signature(BigInt(signature.r), BigInt(signature.s), signature.recovery)
  //console.log(sig)
  const messageHash = keccak256(utf8ToBytes(`${recipient}${amount}`))
  //console.log('messageHash', messageHash)
  try {
    var signer = sig.recoverPublicKey(messageHash)
    signer = signer.toHex(true)
    if (signer !== sender) {
      console.log('sender:', sender)
      console.log('signer:', signer)
      res.status(400).send({ message: `Sender address does not match signature` });
      return
    }
  } catch (ex) {
    console.log(ex)
    res.status(400).send({ message: `Invalid signature: ${ex}` });
    return
  }
  const valid = secp256k1.verify(sig, messageHash, sender)
  if (!valid) {
    res.status(400).send({ message: `Invalid signature` });
    return
  }

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
