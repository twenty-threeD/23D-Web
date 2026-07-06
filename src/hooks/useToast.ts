import { toast } from "sonner";

interface IToast {
	message: string;
    type?: "success" | "error" | "warning" | "info"
}

export const useToast = () => {
	const addToast = ({ message, type = "success" }: IToast) => {
		switch (type) {
			case "error":
				toast.error(message);
				break;
			case "warning":
				toast.warning(message);
				break;
			case "info":
				toast.info(message);
				break;
			default:
				toast.success(message); // default fallback
				break;
		}
	};

	return { addToast };
};