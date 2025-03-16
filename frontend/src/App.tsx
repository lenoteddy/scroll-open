import { useEffect, useState } from "react";
import { useChains, ChainIcon, ConnectKitButton } from "connectkit";
import { useAccount, useBalance, useSwitchChain, useSignMessage } from "wagmi";
import { formatEther } from "viem";
import StringHelper from "./helpers/StringHelper";
import Logo from "./assets/logo.png";
import IconTelegram from "./assets/i-telegram.svg";
import IconX from "./assets/i-x.svg";
import APIHelper from "./helpers/APIHelper";

type PlanOption = {
	user_plan_id: string;
	user_plan_name: string;
	user_plan_source_token: string;
	user_plan_destination_token: string;
	user_plan_amount: string;
	user_plan_frequency: string;
};

type Transaction = {
	user_plan_tx_id: string;
	user_plan_id: string;
	user_plan_tx_epoch: string;
	user_plan_tx_info: string;
	user_plan_tx_hash: string;
};

function App() {
	const stepList = [
		{ id: 1, title: "Connect Wallet", description: "Please connect wallet to proceed with other action" },
		{ id: 2, title: "Setup Plan", description: "Create or modify automate investment plans to execute" },
		{ id: 3, title: "Setup Vault", description: "Create vaults for investment plans to automate transactions" },
		{ id: 4, title: "Track Transaction", description: "Monitor your investment automation transactions" },
	];
	const tokenList = [
		{ id: "", name: "Choose Token" },
		{ id: "0x0000000000000000000000000000000000000000", name: "ETH" },
		{ id: "0xd9692f1748afee00face2da35242417dd05a8615", name: "GHO" },
	];
	const tokenVaultList = [
		{ id: "", name: "Choose Token" },
		{ id: "0x0000000000000000000000000000000000000000", name: "ETH" },
		{ id: "0xd9692f1748afee00face2da35242417dd05a8615", name: "GHO" },
	];
	const [step, setStep] = useState(0);
	const [planMenu, setPlanMenu] = useState("CREATE");
	const [plans, setPlans] = useState<PlanOption[]>([]);
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [planID, setPlanID] = useState("");
	const [planName, setPlanName] = useState("");
	const [planTokenFrom, setPlanTokenFrom] = useState("");
	const [planTokenTo, setPlanTokenTo] = useState("");
	const [planAmount, setPlanAmount] = useState(0);
	const [planFrequency, setPlanFrequency] = useState(0);
	const [vaultPlan, setVaultPlan] = useState(-1);
	const [vaultWithdrawToken, setVaultWithdrawToken] = useState("");
	const [trackVaultPlan, setTrackVaultPlan] = useState(-1);
	const [hasSigned, setHasSigned] = useState(false);
	const { address, isConnected, chain } = useAccount();
	const { data: balance, isLoading } = useBalance({ address });
	const chains = useChains();
	const { switchChain } = useSwitchChain();
	const { signMessage, data: signature, isSuccess } = useSignMessage();

	const chooseStep = async (index: number) => {
		setStep(index);
		if ([1, 2, 3].includes(index)) {
			try {
				const savedToken = sessionStorage.getItem("TOKEN");
				APIHelper.setAuthToken(savedToken);
				const data = await APIHelper.getPlans();
				setPlans(data);
			} catch {
				sessionStorage.setItem("TOKEN", "");
				window.location.reload();
			}
		}
	};
	const choosePlanMenu = (menu: string) => {
		setPlanMenu(menu);
		// reset input
		setPlanID("");
		setPlanName("");
		setPlanTokenFrom("");
		setPlanTokenTo("");
		setPlanAmount(0);
		setPlanFrequency(0);
	};
	const choosePlan = async (id: string) => {
		setPlanID(id);
		const { user_plan_name, user_plan_source_token, user_plan_destination_token, user_plan_amount, user_plan_frequency } = plans[Number(id)];
		setPlanName(user_plan_name);
		setPlanTokenFrom(user_plan_source_token);
		setPlanTokenTo(user_plan_destination_token);
		setPlanAmount(Number(user_plan_amount));
		setPlanFrequency(Number(user_plan_frequency));
	};
	const submitPlan = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const planData = {
			address: String(address),
			name: planName,
			source_token: planTokenFrom,
			destination_token: planTokenTo,
			amount: planAmount,
			frequency: planFrequency,
		};
		const savedToken = sessionStorage.getItem("TOKEN");
		APIHelper.setAuthToken(savedToken);
		if (planMenu === "CREATE") {
			const { message, data } = await APIHelper.createPlan(planData);
			setPlans((prevItems) => [
				...prevItems,
				{
					user_plan_id: data.id,
					user_plan_name: data.name,
					user_plan_source_token: data.source_token,
					user_plan_destination_token: data.destination_token,
					user_plan_amount: data.amount,
					user_plan_frequency: data.frequency,
				},
			]);
			// reset input
			setPlanName("");
			setPlanTokenFrom("");
			setPlanTokenTo("");
			setPlanAmount(0);
			setPlanFrequency(0);
			alert(message);
		} else if (planMenu === "MODIFY") {
			const { message, data } = await APIHelper.updatePlan(plans[Number(planID)].user_plan_id, planData);
			setPlans((prevItems) => {
				return prevItems.map((item, i) =>
					i === Number(planID)
						? {
								...item,
								user_plan_name: data.name,
								user_plan_source_token: data.source_token,
								user_plan_destination_token: data.destination_token,
								user_plan_amount: data.amount,
								user_plan_frequency: data.frequency,
						  }
						: item
				);
			});
			// reset input
			setPlanName(data.name);
			setPlanTokenFrom(data.source_token);
			setPlanTokenTo(data.destination_token);
			setPlanAmount(data.amount);
			setPlanFrequency(data.frequency);
			alert(message);
		} else {
			alert("Invalid request! Please try again later!");
		}
	};
	const chooseTrackPlan = async (id: number) => {
		setTrackVaultPlan(id);
		const data = await APIHelper.getTransactionsByPlanId(plans[id].user_plan_id);
		setTransactions(data);
	};

	useEffect(() => {
		if (isConnected && address && !hasSigned) {
			(async () => {
				try {
					const savedToken = sessionStorage.getItem("TOKEN");
					if (!savedToken) {
						const message = await APIHelper.getAuthToken(address);
						sessionStorage.setItem("TOKEN", message);
						signMessage({ message });
					}
				} catch (err) {
					sessionStorage.setItem("TOKEN", "");
					alert(JSON.stringify(err));
				}
			})();
		}
	}, [isConnected, address, hasSigned, signMessage]);

	useEffect(() => {
		if (isSuccess) {
			(async () => {
				try {
					const message = sessionStorage.getItem("TOKEN");
					await APIHelper.verifyAuth(address, message, signature);
					setHasSigned(true);
				} catch (err) {
					alert(JSON.stringify(err));
				}
			})();
		}
	}, [address, signature, isSuccess]);

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
									<li key={index} className="relative mb-4 cursor-pointer" onClick={() => chooseStep(index)}>
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
											<button className={"btn-plan " + (planMenu === "CREATE" && "active")} onClick={() => choosePlanMenu("CREATE")}>
												Create New Plan
											</button>
											<button className={"btn-plan " + (planMenu === "MODIFY" && "active")} onClick={() => choosePlanMenu("MODIFY")}>
												Modify Existing Plan
											</button>
										</div>
										<form onSubmit={submitPlan}>
											{planMenu === "MODIFY" && (
												<div className="mb-3 pb-4 border-b-2 border-dashed">
													<label className="text-sm font-semibold">Select Existing Plan</label>
													<select required className="w-full p-2 border-1 rounded-xl bg-white" value={planID} onChange={(e) => choosePlan(e.target.value)}>
														<option value="">Choose existing plan</option>
														{plans.map((val, key) => {
															return (
																<option key={key} value={key}>
																	{val.user_plan_name}
																</option>
															);
														})}
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
																<input
																	type="text"
																	className="mt-1 w-full p-2 border-1 rounded-xl bg-white"
																	placeholder="Enter source token contract address"
																	value={planTokenFrom}
																	onChange={(e) => setPlanTokenFrom(e.target.value)}
																/>
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
																		value={planTokenTo}
																		onChange={(e) => setPlanTokenTo(e.target.value)}
																	/>
																)}
															</div>
														</div>
													</div>
													<div className="mb-2 flex items-center gap-x-4">
														<div className="w-full">
															<label className="text-sm font-semibold">Amount (in source token)</label>
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
																onChange={(e) => setPlanFrequency(Number(e.target.value))}
															>
																<option value="">Choose frequency</option>
																<option value="60">every minutes</option>
																<option value="3600">every hour</option>
																{/* <option value="daily">Daily</option>
																<option value="weekly">Weekly</option>
																<option value="monthly">Monthly</option> */}
															</select>
														</div>
													</div>
													<button type="submit" className="mt-4 w-full p-2 rounded-xl bg-blue-500 text-white cursor-pointer">
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
						{step === 2 && (
							<div className="mt-4">
								{address ? (
									<div>
										<div className="flex items-center gap-x-4 mb-4 pb-4 border-b-2 border-dashed">
											{plans.map((val, key) => {
												return (
													<button key={key} className={"btn-vault " + (vaultPlan === key && "active")} onClick={() => setVaultPlan(key)}>
														{val.user_plan_name}
													</button>
												);
											})}
										</div>
										{/* TODO: check vault has been created or not */}
										{vaultPlan === 0 && (
											<div className="mx-auto text-center">
												<button className="btn-action-vault">Create a Vault</button>
											</div>
										)}
										{vaultPlan === 1 && (
											<>
												<div className="mb-4 pb-4 border-b-2 border-dashed">
													<div className="mb-6">
														<div className="mb-2">
															<div className="font-bold">Automation address:</div>
															<div className="text-sm italic">...</div>
															<p className="text-sm italic">*please fill this address with ether to run the transaction</p>
														</div>
														<div className="mb-2">
															<div className="font-bold">Automation ETH balance:</div>
															<div className="text-sm italic">...</div>
														</div>
														<button className="w-full btn-action-vault">Withdraw ETH from Automation</button>
													</div>
													<div className="mb-2">
														<div className="font-bold">Vault address:</div>
														<div className="text-sm italic">...</div>
													</div>
													<div className="mb-2">
														<div className="font-bold">Vault ETH balance:</div>
														<div className="text-sm italic">...</div>
													</div>
													<div className="mb-2">
														<div className="font-bold">Vault GHO balance:</div>
														<div className="text-sm italic">...</div>
													</div>
												</div>
												<form>
													<div className="mb-2">
														<label className="text-sm font-semibold">Select Token</label>
														<select required className="w-full p-2 border-1 rounded-xl bg-white" onChange={(e) => setVaultWithdrawToken(e.target.value)}>
															{tokenVaultList.map((token, index) => {
																return (
																	<option key={index} value={token.id} selected={vaultWithdrawToken === token.id}>
																		{token.name}
																	</option>
																);
															})}
															<option value="other" selected={!tokenVaultList.map((item) => item.id).includes(vaultWithdrawToken)}>
																Other token
															</option>
														</select>
														{!tokenVaultList.map((item) => item.id).includes(vaultWithdrawToken) && (
															<input type="text" className="mt-1 w-full p-2 border-1 rounded-xl bg-white" placeholder="Enter source token contract address" />
														)}
													</div>
													<div className="mb-2">
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
													<button className="mt-4 w-full btn-action-vault">Withdraw Vault</button>
												</form>
											</>
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
						{step === 3 && (
							<div className="mt-4">
								{address ? (
									<div>
										<div className="flex items-center gap-x-4 mb-4 pb-4 border-b-2 border-dashed">
											{plans.map((val, key) => {
												return (
													<button key={key} className={"btn-track " + (trackVaultPlan === key && "active")} onClick={() => chooseTrackPlan(key)}>
														{val.user_plan_name}
													</button>
												);
											})}
										</div>
										{trackVaultPlan !== -1 && (
											<div className="table-track scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-">
												<div className="inline-block min-w-[800px]">
													<div className="flex gap-2 bg-gray-800 p-2 text-white font-bold rounded-t-lg">
														<div className="col-no text-center">No</div>
														<div className="col-time text-center">Time</div>
														<div className="col-info text-center">Info</div>
														<div className="col-hash text-center">Hash</div>
													</div>
													<div className="bg-white divide-y divide-gray-300">
														{transactions.map((val, key) => {
															return (
																<div key={key} className="flex gap-2 p-2 hover:bg-gray-100">
																	<div className="col-no text-center">{key + 1}</div>

																	<div className="col-time text-center">{StringHelper.formatUnixTimestamp(Number(val.user_plan_tx_epoch))}</div>
																	<div className="col-info">{val.user_plan_tx_info}</div>
																	<div className="col-hash">
																		<a
																			href={`https://sepolia.scrollscan.com/tx/${val.user_plan_tx_hash}`}
																			className="underline italic"
																			target="_blank"
																			rel="noreferrer noopener"
																		>
																			{val.user_plan_tx_hash}
																		</a>
																	</div>
																</div>
															);
														})}
													</div>
												</div>
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
