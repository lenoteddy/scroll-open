import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { scrollSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

const config = createConfig(
	getDefaultConfig({
		// Your dApps chains
		chains: [scrollSepolia],
		transports: {
			// RPC URL for each chain
			[scrollSepolia.id]: http("https://sepolia-rpc.scroll.io"),
		},
		walletConnectProjectId: "1151ebbeea1b3385e767bb7c7c04b6c6", // Required API Keys
		appName: "CryptoRecurring", // Required App Info
		appDescription: "automate your crypto investment", // Optional App Info
		appUrl: "http://cryptorecurring.com/", // your app's url
		appIcon: "http://cryptorecurring.com/src/assets/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
	})
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: ReactNode }) => {
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<ConnectKitProvider>{children}</ConnectKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
};
