import { BrowserProvider, ethers } from 'ethers';
import { SiweMessage } from 'siwe';
import { parseEther } from "@ethersproject/units";

import tokenAbi from "./ERC20.json";

const scheme = window.location.protocol.slice(0, -1);
const domain = window.location.host;
const origin = window.location.origin;
const provider = new BrowserProvider(window.ethereum);

const BACKEND_ADDR = "http://localhost:3000";
const chainId = '943';

async function createSiweMessage(address, statement) {
    const res = await fetch(`${BACKEND_ADDR}/nonce`, {
        credentials: 'include',
    });
    const message = new SiweMessage({
        scheme,
        domain,
        address,
        statement,
        uri: origin,
        version: '1',
        chainId: chainId,
        nonce: await res.text()
    });
    return message.prepareMessage();
}

function connectWallet() {
    provider.send('eth_requestAccounts', [])
        .catch(() => console.log('user rejected request'));
}

async function signInWithEthereum() {
    const signer = await provider.getSigner();

    const message = await createSiweMessage(
        await signer.getAddress(),
        'Sign in with Ethereum to the app.'
    );
    const signature = await signer.signMessage(message);

    const res = await fetch(`${BACKEND_ADDR}/verify`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, signature }),
        credentials: 'include'
    });
    console.log(await res.text());
}

async function getInformation() {
    const res = await fetch(`${BACKEND_ADDR}/personal_information`, {
        credentials: 'include',
    });
    console.log(await res.text());
}


const tokenAddress = `0x9816b46FBA0D2EA58418eff2d21fFc56Dc93352a`;
const receiverAddress = `0x6f1Aa63b3eAe8D7d3934BD7899D9405c88ae4984`;

async function handleApprove() {
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    if (address) {
        if (chainId) {
            try {
                if (tokenAddress) {
                    console.log("Waiting for confirmation 👌");

                    let amount = parseEther("100").toString();
                    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, await provider?.getSigner());
                    await (await (tokenContract.connect(await provider?.getSigner())).approve(receiverAddress, amount)).wait();
                } else {
                    console.error("Please enter a valid token address !");
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            console.error("Please select Rails Testnet or Mainnet !");
        }
    } else {
        console.error("Please Connect Your Wallet!");
    }
};

const connectWalletBtn = document.getElementById('connectWalletBtn');
const siweBtn = document.getElementById('siweBtn');
const infoBtn = document.getElementById('infoBtn');
const approveBtn = document.getElementById('approveBtn');
connectWalletBtn.onclick = connectWallet;
siweBtn.onclick = signInWithEthereum;
infoBtn.onclick = getInformation;
approveBtn.onclick = handleApprove;
