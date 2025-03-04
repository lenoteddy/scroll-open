import Logo from "./assets/logo.png";

function App() {
	const connectWallet = async () => {
		// TODO: connect wallet functionality
	};

	return (
		<div className="container">
			<header>
				<nav className="flex items-center justify-between">
					<a href="/" className="flex items-center">
						<img src={Logo} alt="logo" className="w-16 mr-1" />
						<div>
							<h1 className="pb-1 leading-none text-xl font-semibold">CryptoRecurring</h1>
							<p className="text-xs">automate your crypto investment</p>
						</div>
					</a>
					<button className="btn-connect-wallet" onClick={connectWallet}>
						Connect Wallet
					</button>
				</nav>
			</header>
			{/* TODO: create body */}
			{/* TODO: create footer */}
		</div>
	);
}

export default App;
