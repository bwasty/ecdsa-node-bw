import { useState } from "react";
import server from "./server";
import { secp256k1 } from "ethereum-cryptography/secp256k1"
import { keccak256 } from "ethereum-cryptography/keccak"
import { utf8ToBytes } from "ethereum-cryptography/utils"


function Transfer({ address, privateKey, setBalance }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    let amount = parseInt(sendAmount);
    const messageHash = keccak256(utf8ToBytes(`${recipient}${amount}`))
    //console.log('messageHash', messageHash)
    let sig = secp256k1.sign(messageHash, privateKey)
    //console.log(sig)
    //console.log('recovered', sig.recoverPublicKey(messageHash).toHex());
    //signatureCompact = signature.toCompactHex()

    try {
      const {
        data: { balance },
      } = await server.post(`send`, {
        sender: address,
        signature: {r: sig.r.toString(), s: sig.s.toString(), recovery: sig.recovery},
        amount: amount,
        recipient,
      });
      setBalance(balance);
    } catch (ex) {
      //console.log(ex)
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
