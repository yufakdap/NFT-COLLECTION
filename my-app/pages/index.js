import {useEffect, useRef, useState} from "react";
import Head from "next/head";
import {Contract, providers, utils} from "ethers";
import styles from "../styles/Home.module.css";
import Web3Modal, { getProviderInfo } from "web3modal";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from "../constants";

export default function Home() {
    const [isOwner, setIsOwner]= useState(false);
    const [presaleStarted, setPresaleStarted]= useState(false);
    const [walletConnected, setWalletConnected] = useState(false);
    const [presaleEnded, setPresaleEnded] = useState(false);
    const [loading, setLoading]=useState(false);
    const web3ModalRef = useRef();

    const presaleMint = async ()=>{
      try {
        const signer = await getProviderOrSigner(true);

        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          NFT_CONTRACT_ABI,
          signer
        );

        const tnx = await nftContract.presaleMint({
          value: utils.parseEther("0.01")
        })
        await tnx.wait();
        
        window.alert("you succesfully minted a CryptoDev!");
      } catch (error) {
        console.error(error);
      }
    }

    const publicMint = async ()=>{
      try {
        const signer = await getProviderOrSigner(true);

        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          NFT_CONTRACT_ABI,
          signer
        );
        const tnx = await nftContract.mint({
          value: utils.parseEther("0.01"),
        });
        await tnx.wait();
        
        window.alert("you succesfully minted a CryptoDev!");
      } catch (error) {
        console.error(error);
      }
    }


    const checkIfPresaleEnded =  async()=>{
      try {
        const provider = await getProviderOrSigner();
        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          NFT_CONTRACT_ABI,
          provider
        );
        
        const presaleEndedTime = await nftContract.presaleEnded();
        const hasEnded = presaleEndedTime.lt(Math.floor(Date.now()/1000));
        if(hasEnded){
          setPresaleEnded(true);
        }else{
          setPresaleEnded(false);
        }
        return hasEnded;
      } catch (err) {
        console.error(err)
        return false;
      }
    }

    const getOwner = async ()=>{
      try {
        const signer = await getProviderOrSigner(true);
        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          NFT_CONTRACT_ABI,
          signer
        );
          const owner = await nftContract.owner();
          
          const userAddress= await signer.getAddress();

          if(owner.toLowerCase()===userAddress.toLowerCase()){
            setIsOwner(true);
          }

      } catch (error) {
        console.error(error)
      }
    }

    const startPresale =async ()=>{
      try {
        const signer = await getProviderOrSigner(true);

        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS, 
          NFT_CONTRACT_ABI, 
          signer);

          const txn = await nftContract.startPresale();
          await txn.wait();

          setPresaleStarted(true);


      } catch (error) {
        console.error(error)
      }

    }

    const checkIfPresaleStarted =async()=>{
      try {
        const provider = await getProviderOrSigner();

        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS, 
          NFT_CONTRACT_ABI, 
          provider)

          const _presaleStarted = await nftContract.presaleStarted();
          if (!_presaleStarted) {
            await getOwner();
          }
          setPresaleStarted(_presaleStarted);
          return _presaleStarted;
        } catch (err) {
          console.error(err);
          return false;
        }
      };

    const connectWallet = async()=>{
      try {
        await getProviderOrSigner();
        setWalletConnected(true);
      } catch (error) {
        console.error(error)
        
      }
     
    };

    const getProviderOrSigner = async (needSigner = false)=>{
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);

      const {chainId}= await web3Provider.getNetwork();
        if (chainId !==5){
          window.alert("Please switch to the Goeril Network");
          throw new Error("Incorrect network");
        }
      if (needSigner){
        const signer = web3Provider.getSigner();
        return signer;
      }
      return web3Provider;
    }

    const OnPageLoad = async ()=>{
      await connectWallet();
      console.log("succesfully connect34e");
      await getOwner();
      const presaleStarted = await checkIfPresaleStarted();
      if(presaleStarted){
        await checkIfPresaleEnded();
      }
      
  }
    useEffect(()=>{
      if(!walletConnected){
        web3ModalRef.current= new Web3Modal({
          network: "goerli",
          providerOptions:{},
          disableInjectionProvider: false,
        });
        OnPageLoad();
      }
    },[])

   const renderBody=()=>{
      if(!walletConnected){
        return(
          <button onClick={connectWallet} className={styles.button}>
            Connect your Wallet
          </button>
        )
      }

      if(loading){
        return <span className={styles.description}>Loading...</span>;
      }

      if (isOwner && !presaleStarted){
        return(
          <button onClick={startPresale} className={styles.button}>
            Start Presale
          </button>
        );
      }

      if(!presaleStarted){
        return(
        <div>
          <span className={styles.description}>
            Presale has not started yet, Come back later!
          </span>
        </div>

      )}
      if(presaleStarted && !presaleEnded){
        
        return(
          <div>
            <span className={styles.description}>
              Presale has started! If your address is whitelisted, you can mint a 
              CrytpoDev!
              </span>
            <button className={styles.button} onClick={presaleMint}>
              Presale Mint
              </button>
          </div>
        )

      }
      if(presaleStarted && presaleEnded){
        return(
          <div>
          <span className={styles.description}>
            Presale has Ended.  
            You can mint a CryptoDev in Public sale , if any remain.
            </span>
            <button className={styles.button} onClick={publicMint}>
            Public mint
            </button>
          </div>
        );

      }

    };

  return( 
  <div>
    <Head>
      <title> Crypto Devs NFT</title>
    </Head>
    <div className={styles.main}>
      <div>
        <h1 className={styles.title}>Welcome to CryptoDevs</h1>
        <span className={styles.description}>
          CryptoDevs NFT is a collection for developers in web3
        </span>
      </div>
    

      <div className={styles.main}>
      {renderBody()}
      </div>
      <img className={styles.image} src="./cryptodevs/0.svg" />
    </div>
    <footer className={styles.footer}>
      Made with &#10084; by Crypto Devs
    </footer>
  </div>
  );
}
``