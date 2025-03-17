import axios from "axios";

type PlanData = {
	address: string;
	name?: string;
	source_token?: string;
	destination_token?: string;
	amount?: number;
	frequency?: number;
	vault?: string;
};

const API_BASE_URL = "http://localhost:3000"; // Change this to your API base URL

const apiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Set authentication token
const setAuthToken = (token: string | null) => {
	apiClient.defaults.headers.common["x-app-token"] = token;
};

// Get authentication token
const getAuthToken = async (address: string) => {
	try {
		const response = await apiClient.get(`/auth/token/${address}`);
		return response.data.token;
	} catch (error) {
		console.error("Error fetching auth token:", error);
		throw error;
	}
};

// Verify authentication
const verifyAuth = async (address: `0x${string}` | undefined, message: string | null, signature: string) => {
	try {
		const response = await apiClient.post("/auth/verify", {
			address,
			message,
			signature,
		});
		return response.data.isValid;
	} catch (error) {
		console.error("Error verifying auth:", error);
		throw error;
	}
};

// Fetch all plans
const getPlans = async () => {
	try {
		const response = await apiClient.get("/plans");
		return response.data;
	} catch (error) {
		console.error("Error fetching plans:", error);
		throw error;
	}
};

// Fetch a single plan by ID
const getPlanById = async (id: string) => {
	try {
		const response = await apiClient.get(`/plans/${id}`);
		return response.data;
	} catch (error) {
		console.error("Error fetching plan:", error);
		throw error;
	}
};

// Create a new plan
const createPlan = async (planData: PlanData) => {
	try {
		const response = await apiClient.post("/plans", planData);
		return response.data;
	} catch (error) {
		console.error("Error creating plan:", error);
		throw error;
	}
};

// Update an existing plan
const updatePlan = async (id: string, planData: PlanData) => {
	try {
		const response = await apiClient.put(`/plans/${id}`, planData);
		return response.data;
	} catch (error) {
		console.error("Error updating plan:", error);
		throw error;
	}
};

// Fetch transactions for a plan
const getTransactionsByPlanId = async (planId: string) => {
	try {
		const response = await apiClient.get(`/transactions/${planId}`);
		return response.data;
	} catch (error) {
		console.error("Error fetching transactions:", error);
		throw error;
	}
};

const APIHelper = {
	setAuthToken,
	getAuthToken,
	verifyAuth,
	getPlans,
	getPlanById,
	createPlan,
	updatePlan,
	getTransactionsByPlanId,
};

export default APIHelper;
