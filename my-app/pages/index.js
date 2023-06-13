import {Contract, providers, utils} from "ethers";
import Head from "next/head";
import React, {useEffect, useRef, useState} from "react";
import Web3Modal from "web3modal";
import {abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [tokenIdsMinted, setTokenIdsMinted] =useState("0");
  const web3ModalRef=useRef();


 const presaleMint =async ()=>{
  try{
    const signer =await getProviderOrSigner(true);
    const nftContract  = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
    const tx =await nftContract.presaleMint({
      value:utils.parserEther("0.01"),
    });
    setLoading(true);
    await tx.wait();
    setLoading(false);
    window.alert("you succesfully minted a Crypto Dev!");
  }catch(err){
    console.error(err);
  }
 };



 const publicMint = async () => {
  try{
    const signer = await getProviderOrSigner(true);

    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
    const tx = await nftContract.mint({
      value:utils.pareseEther("0.01"),
    });
    setLoading(true);
    await tx.wait();
    setLoading(false);
    window.alert("You succesfully minted a Crypto Dev!");
  } catch (err) {
    console.error(err);
  }
 };




 const connectWallet = async()=>{
  try{
    await getProviderOrSigner();
    setWalletConnected(true);
  }catch(err){
    console.error(err);
  }
 };




 const startPresale = async ()=>{
  try{
    const signer = await getProviderOrSigner(true);
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);

    const tx = await nftContract.startPresale();
    
    setLoading(true);
    await tx.wait();
    setLoading(false);
    await checkIfPresaleStarted();
  }catch (err){
    console.error(err);
  }
 };




 const checkIfPresaleStarted = async()=>{
  try{
    const provider = await getProviderOrSigner();
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS , abi, provider);

    const _presaleStarted = await nftContract.presaleStarted();
    if(!_presaleStarted){
      await getOwner();
     }
    setPresaleStarted(_presaleStarted);
    return _presaleStarted;
  } catch (err){
    console.error(err)
    return false;
  }
};



 

 const checkIfPresaleEnded = async() =>{
  try{
  const provider = await getProviderOrSigner();

  const nftContract = new Contract (NFT_CONTRACT_ADDRESS, abi , provider);

  const _presaleEnded = await nftContract.presaleEnded();

  const hasEnded = await _presaleEnded.lt(Math.floor(Date.now()/1000));
  if (hasEnded){
    setPresaleEnded(true);
  }else {
    setPresaleEnded(false);
  }
  return hasEnded;
 }catch(err){
  console.error(err);
  return false;
 }
};




const getOwner = async()=>{
  try{
    const provider = await getProviderOrSigner();

    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

    const _owner = await nftContract.owner();

    const signer = await getProviderOrSigner(true);

  const address = await signer.getAddress();
  if(address.toLowerCase()=== _owner.toLowerCase()){
    setIsOwner(true);
  } 
  }catch (err){
   console.error(err.message);
  }
};




const getTokenIdsMinted = async ()=>{
 try{
  const provider = await getProviderOrSigner();

  const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi , provider);
  const _tokenIds = await nftContract.tokenIds();

  setTokenIdsMinted(_tokenIds.toString());
}catch(err){
  console.error(err);
} 
};





 const getProviderOrSigner = async(needSigner = false)=>{
  const provider = await web3ModalRef.current.connect();
  const web3Provider = new providers.Web3Provider(provider);

  const {chainId } = await web3Provider.getNetwork();
  if(chainId !==5){
    window.alert("Change the network to Goerli");
    throw new Error("Change the network to goerli");
  }
  if(needSigner){
    const signer = web3Provider.getSigner();
    return signer;
  }
  return web3Provider;
 };




 useEffect(()=>{
  if(!walletConnected){
    web3ModalRef.current= new Web3Modal({
      network: "goerli",
      providerOptions:{},
      disableInjectedProvider: false,
    });
    connectWallet();

    const _presaleStarted = checkIfPresaleStarted();
    if(_presaleStarted){
      checkIfPresaleEnded();
    }

    getTokenIdsMinted();

    const PresaleEndedInterval = setInterval(async function(){
      const _presaleStarted = await checkIfPresaleStarted();
      if(_presaleStarted){
        const _presaleEnded= await checkIfPresaleEnded();
        if(_presaleEnded){
          clearInterval(PresaleEndedInterval);
        }
      }
    },5*1000)

    setInterval(async function (){
      await getTokenIdsMinted();
    },5*1000);
  }
},[walletConnected]);





const renderButton=()=>{
  if(!walletConnected){
    return(
      <button onClick ={connectWallet} className={styles.button}>
        Connect your wallet
      </button>    
      );
  }


  if(walletConnected){
    return(
      <div className={styles.description}>
          Your wallet is connected!
      </div>

    )
  }

  if(loading){
    return <button calssName={styles.button}>Loading..</button>;
  }

  if (isOwner && !presaleStarted){
    return(
      <div>
      <div className={styles.description}>
        The ownner is connected
      </div>
      <button className={styles.button} onClick={startPresale}>
        Start Presale!
      </button>
      </div>
    );
  }
  if(presaleStarted && !presaleEnded){
    return(
      <div>
        <div className={styles.description}>
          Presale has Started!!! if your address is whitelisted, mint a Crypto Dev 🥳
        </div>
        <button calssName={styles.button} onClick={presaleMint}>
          Presale Mint 🚀
        </button>
      </div>
    );
  }

  if(presaleStarted && presaleEnded){
    return(
      <button className={styles.button} onClick={publicMint}>
        Public mint 🚀
      </button>
    );
  }
};






return(
  <div>
    <Head>
      <title>Crypto Devs</title>
      <meta name="description" content ="Whitelist-Dapp"/>
      <link rel ="icon" href="/favicon.ico"/>
    </Head>
    <div className={styles.main}>
      <div>
        <hi className={styles.title}>Welcome to Crypto Devs!</hi>
        <div className={styles.description}>
          it&#39;s an NFT Collection for developers in crypto
        </div>
        <div className={styles.description}>
          {tokenIdsMinted}/20 have been minted
        </div>
        {renderButton()}
      </div>
      <div>
        <img className={styles.footer} src="./cryptodevs/0.svg"/>
      </div>
    </div>
   <footer className={styles.footer}>
    Made with &#10084; by Cyrpto devs
   </footer>
  </div>
);
}


