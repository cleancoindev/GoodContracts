const Web3 = require("web3");
const SafeHDWalletProvider = require("truffle-safe-hdwallet-provider");
const AdminWallet = artifacts.require("./AdminWallet.sol");
const settings = require("./deploy-settings.json");
// if (process.env.NODE_ENV !== 'production') { // https://codeburst.io/process-env-what-it-is-and-why-when-how-to-use-it-effectively-505d0b2831e7
require("dotenv").load();
// }

const HDWalletProvider = require("truffle-hdwallet-provider");

const admin_mnemonic = process.env.ADMIN_MNEMONIC;
const admin_password = process.env.ADMIN_PASSWORD;
const infura_api = process.env.INFURA_API;

module.exports = async function (deployer, network, accounts) {
  if (network.indexOf("mainnet") >= 0) {
    console.log("Skipping adminwallet for mainnet");
    return;
  }
  if (network != "ganache" && network != "test" && network != "coverage") {
    const adminWallet = await AdminWallet.deployed();
    const networkSettings = { ...settings["default"], ...settings[network] };

    let adminWalletBalance = await web3.eth
      .getBalance(adminWallet.address)
      .then(parseInt);
    const adminWalletValue = web3.utils.toWei(
      networkSettings.walletTransfer,
      networkSettings.walletTransferUnits
    );
    console.log({ adminWalletBalance, adminWalletValue });
    if (adminWalletBalance <= parseInt(adminWalletValue)) {
      await web3.eth.sendTransaction({
        to: adminWallet.address,
        from: accounts[0],
        value: adminWalletValue
      });
      adminWalletBalance = await web3.eth.getBalance(adminWallet.address).then(parseInt);
      console.log("adminwallet balance after top:", { adminWalletBalance });
    }

    let adminProvider = new SafeHDWalletProvider(
      admin_mnemonic,
      "https://rpc.fuse.io/",
      0,
      10,
      admin_password
    );

    const adminsWeb3 = new Web3(adminProvider);
    const admins = await adminsWeb3.eth.getAccounts();

    await adminWallet
      .addAdmins(admins)
      .then(_ => console.log({ admins }))
      .catch(e => console.log("addAdmin failed:", e));
    await adminWallet.topAdmins(0).catch(e => console.log("topAdmins failed:", e));
  }
};
