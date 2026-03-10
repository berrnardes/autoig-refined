"use client";

import { api } from "@/lib/api-client";
import type { Evaluation } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useCredits() {
	return useQuery({
		queryKey: ["credits"],
		queryFn: async () => {
			const { data } = await api.get<{ balance: number }>("/credits/balance");
			return data.balance;
		},
	});
}

export function useEvaluation(id: string) {
	const query = useQuery({
		queryKey: ["evaluations", id],
		queryFn: async () => {
			const { data } = await api.get<Evaluation>(`/evaluations/${id}`);
			return data;
		},
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			if (status && !["completed", "failed"].includes(status)) return 3000;
			return false;
		},
	});
	return query;
}

export function useEvaluations() {
	return useQuery({
		queryKey: ["evaluations"],
		queryFn: async () => {
			const { data } = await api.get<Evaluation[]>("/evaluations");
			return data;
		},
	});
}

export function useCreateEvaluation() {
	const queryClient = useQueryClient();
	const router = useRouter();

	return useMutation({
		mutationFn: async (input: { username: string; competitors: string[] }) => {
			const { data } = await api.post<Evaluation>("/evaluations", input);
			return data;
		},
		onSuccess: (evaluation) => {
			queryClient.invalidateQueries({ queryKey: ["evaluations"] });
			queryClient.invalidateQueries({ queryKey: ["credits"] });
			router.push(`/dashboard/evaluations/${evaluation.id}`);
		},
	});
}
