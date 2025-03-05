import { useState } from "react";
import { useChains, ChainIcon, ConnectKitButton } from "connectkit";
import { useAccount, useBalance, useSwitchChain } from "wagmi";
import StringHelper from "./helpers/StringHelper";
import Logo from "./assets/logo.png";
import IconTelegram from "./assets/i-telegram.svg";
import IconX from "./assets/i-x.svg";
import { formatEther } from "viem";

function App() {
	const stepList = [
		{ id: 1, title: "Connect Wallet", description: "Please connect wallet to proceed with other action" },
		{ id: 2, title: "Setup Plan", description: "Create or modify automate investment plans to execute" },
		{ id: 3, title: "Setup Vault", description: "Create vaults for investment plans to automate transactions" },
		{ id: 4, title: "Track Transaction", description: "Monitor your investment automation transactions" },
	];
	const tokenList = [
		{ id: "", name: "Choose Token" },
		{ id: "usdt", name: "USDT" },
		{ id: "btc", name: "BTC" },
		{ id: "eth", name: "ETH" },
	];
	const [step, setStep] = useState(1);
	const [planMenu, setPlanMenu] = useState("CREATE");
	const [planID, setPlanID] = useState("");
	const [planName, setPlanName] = useState("");
	const [planTokenFrom, setPlanTokenFrom] = useState("");
	const [planTokenTo, setPlanTokenTo] = useState("");
	const [planAmount, setPlanAmount] = useState(0);
	const [planFrequency, setPlanFrequency] = useState("");
	const { address, chain } = useAccount();
	const { data: balance, isLoading } = useBalance({ address });
	const chains = useChains();
	const { switchChain } = useSwitchChain();

	const submitPlan = async () => {
		// TODO: submit plan function
	};

	return (
		<div className="container">
			<header>
				<nav className="flex items-center justify-between">
					<a href="/" className="flex items-center">
						<img src={Logo} alt="logo" className="w-16 mr-1" />
						<div className="text-left">
							<h1 className="pb-1 leading-none text-xl font-semibold">CryptoRecurring</h1>
							<p className="text-xs">automate your crypto investment</p>
						</div>
					</a>
					<ConnectKitButton.Custom>
						{({ show, isConnected, address }) => {
							return (
								<button className="btn-connect-wallet" onClick={show}>
									{isConnected && address ? StringHelper.shortHex(address) : "Connect Wallet"}
								</button>
							);
						}}
					</ConnectKitButton.Custom>
				</nav>
			</header>
			<main className="grid md:grid-cols-3 gap-8 my-8">
				<div className="md:col-span-1">
					<div className="p-4 rounded-2xl bg-gray-200">
						<h2 className="text-lg font-semibold">Welcome to CryptoRecurring!</h2>
						<p className="text-sm italic">
							Please follow this step by step process
							<br />
							*click the process
						</p>
						<ul className="mt-4">
							{stepList.map((item, index) => {
								return (
									<li key={index} className="relative mb-4 cursor-pointer" onClick={() => setStep(index)}>
										<button className={`absolute cursor-pointer btn-step-by-step ${step >= index ? "active" : ""}`}>{step >= index ? "✓" : index + 1}</button>
										<div className="ml-14">
											<h3 className="text-lg font-semibold">{item.title}</h3>
											<p className="text-sm">{item.description}</p>
										</div>
									</li>
								);
							})}
						</ul>
					</div>
				</div>
				<div className="md:col-span-2">
					<div className="p-4 rounded-2xl bg-gray-300">
						<h3 className="text-xl font-semibold">{stepList[step]?.title}</h3>
						<p className="text-md italic">{stepList[step]?.description}</p>
						{/* TODO: step by step process (done 1, 2) */}
						{step === 0 && (
							<div className="mt-4">
								{address ? (
									<div>
										<div className="mb-2">
											<div className="font-bold">Wallet address:</div>
											<div className="text-sm italic">{address}</div>
										</div>
										<div className="mb-2">
											<div className="font-bold">ETH balance:</div>
											<div className="text-sm italic">{isLoading ? "..." : formatEther(BigInt(balance?.value || 0)) + " ETH"}</div>
										</div>
										<div className="mb-2">
											<div className="font-bold">Chain Info:</div>
											{!chain ? (
												<div className="text-sm italic font-semibold">Unsupported network!</div>
											) : (
												<div className="text-sm italic">{`${chain?.name} (${chain?.id})`}</div>
											)}
										</div>
										{!chain && (
											<div className="mt-6 mb-2">
												<div className="mb-1 italic">This dApp is supported on the following chains:</div>
												<ul className="flex items-center gap-x-6">
													{chains.map((chain) => (
														<li key={chain.id}>
															<button className="w-fit flex items-center gap-x-2 cursor-pointer btn-network" onClick={() => switchChain({ chainId: chain.id })}>
																<ChainIcon id={chain.id} />
																<span className="font-semibold">{chain.name}</span>
															</button>
														</li>
													))}
												</ul>
												<p className="mt-2 text-xs italic">*click the chain button to switch chain</p>
											</div>
										)}
									</div>
								) : (
									<div className="mx-auto text-center">
										<ConnectKitButton.Custom>
											{({ show, isConnected, address }) => {
												return (
													<button className="btn-connect-wallet" onClick={show}>
														{isConnected && address ? StringHelper.shortHex(address) : "Connect Wallet"}
													</button>
												);
											}}
										</ConnectKitButton.Custom>
									</div>
								)}
							</div>
						)}
						{step === 1 && (
							<div className="mt-4">
								{address ? (
									<div>
										<div className="mb-2 flex items-center gap-x-2">
											<button className={"btn-plan " + (planMenu === "CREATE" && "active")} onClick={() => setPlanMenu("CREATE")}>
												Create New Plan
											</button>
											<button className={"btn-plan " + (planMenu === "MODIFY" && "active")} onClick={() => setPlanMenu("MODIFY")}>
												Modify Existing Plan
											</button>
										</div>
										<form onSubmit={submitPlan}>
											{planMenu === "MODIFY" && (
												<div className="mb-3 pb-4 border-b-2 border-dashed">
													<label className="text-sm font-semibold">Select Existing Plan</label>
													<select required className="w-full p-2 border-1 rounded-xl bg-white" value={planID} onChange={(e) => setPlanID(e.target.value)}>
														<option value="">Choose choose</option>
														<option value="ABC">Dummy Plan</option>
													</select>
												</div>
											)}
											{planMenu === "CREATE" || (planMenu === "MODIFY" && planID) ? (
												<>
													<div className="mb-2">
														<label className="text-sm font-semibold">Plan Name</label>
														<input
															required
															type="text"
															className="w-full p-2 border-1 rounded-xl bg-white"
															placeholder="Enter your plan name"
															value={planName}
															onChange={(e) => setPlanName(e.target.value)}
														/>
													</div>
													<div className="mb-2 flex items-start gap-x-4">
														<div className="w-full">
															<label className="text-sm font-semibold">Select Source Token</label>
															<select required className="w-full p-2 border-1 rounded-xl bg-white" onChange={(e) => setPlanTokenFrom(e.target.value)}>
																{tokenList.map((token, index) => {
																	return (
																		<option key={index} value={token.id} selected={planTokenFrom === token.id}>
																			{token.name}
																		</option>
																	);
																})}
																<option value="other" selected={!tokenList.map((item) => item.id).includes(planTokenFrom)}>
																	Other token
																</option>
															</select>
															{!tokenList.map((item) => item.id).includes(planTokenFrom) && (
																<input type="text" className="mt-1 w-full p-2 border-1 rounded-xl bg-white" placeholder="Enter source token contract address" />
															)}
														</div>
														<div className="w-full">
															<div className="w-full">
																<label className="text-sm font-semibold">Select Destination Token</label>
																<select required className="w-full p-2 border-1 rounded-xl bg-white" onChange={(e) => setPlanTokenTo(e.target.value)}>
																	{tokenList.map((token, index) => {
																		return (
																			<option key={index} value={token.id} selected={planTokenTo === token.id}>
																				{token.name}
																			</option>
																		);
																	})}
																	<option value="other" selected={!tokenList.map((item) => item.id).includes(planTokenTo)}>
																		Other token
																	</option>
																</select>
																{!tokenList.map((item) => item.id).includes(planTokenTo) && (
																	<input
																		type="text"
																		className="mt-1 w-full p-2 border-1 rounded-xl bg-white"
																		placeholder="Enter destination token contract address"
																	/>
																)}
															</div>
														</div>
													</div>
													<div className="mb-2 flex items-center gap-x-4">
														<div className="w-full">
															<label className="text-sm font-semibold">Amount</label>
															<input
																required
																type="number"
																className="w-full p-2 border-1 rounded-xl bg-white"
																placeholder="0.00"
																value={planAmount}
																onChange={(e) => setPlanAmount(Number(e.target.value))}
															/>
														</div>
														<div className="w-72">
															<label className="text-sm font-semibold">Frequency</label>
															<select
																required
																className="w-full p-2 border-1 rounded-xl bg-white"
																value={planFrequency}
																onChange={(e) => setPlanFrequency(e.target.value)}
															>
																<option value="">Choose frequency</option>
																<option value="daily">Daily</option>
																<option value="weekly">Weekly</option>
																<option value="monthly">Monthly</option>
															</select>
														</div>
													</div>
													<button type="submit" className="mt-4 w-full p-2 rounded-xl bg-blue-500 text-white">
														{planMenu === "CREATE" ? "Create Recurring Investment Plan" : "Modify Recurring Investment Plan"}
													</button>
												</>
											) : (
												<></>
											)}
										</form>
									</div>
								) : (
									<div className="mx-auto text-center">
										<ConnectKitButton.Custom>
											{({ show, isConnected, address }) => {
												return (
													<button className="btn-connect-wallet" onClick={show}>
														{isConnected && address ? StringHelper.shortHex(address) : "Connect Wallet"}
													</button>
												);
											}}
										</ConnectKitButton.Custom>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</main>
			<footer className="p-12 rounded-2xl bg-gray-100">
				<a href="/" className="flex items-center">
					<img src={Logo} alt="logo" className="w-12 mr-1" />
					<div className="text-left">
						<h2 className="pb-1 leading-none text-md font-semibold">CryptoRecurring</h2>
						<p className="text-xs">automate your crypto investment</p>
					</div>
				</a>
				<p className="my-2 text-justify text-xs text-gray-600">
					CryptoRecurring.com helps users to automate their crypto investment by setting up recurring investments to buy crypto on a regular schedule.
				</p>
				<div className="flex items-center gap-x-4 opacity-50">
					<a href="https://x.com/cryptorecurring" target="_blank" rel="noreferrer noopener">
						<img src={IconX} className="h-4" />
					</a>
					<a href="https://t.me/+8Pr86bOssPJkMTJl" target="_blank" rel="noreferrer noopener">
						<img src={IconTelegram} className="h-6" />
					</a>
				</div>
			</footer>
		</div>
	);
}

export default App;
