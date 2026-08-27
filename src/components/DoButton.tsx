type DoButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
};

export default function DoButton({ children, onClick }: DoButtonProps) {
  return (
    <button 
      onClick={onClick} 
      className="w-full py-2 border text-center text-sm font-semibold text-zinc-600 border-zinc-300 rounded-lg transition-colors hover:border-main hover:text-main cursor-pointer"
    >
      {children}
    </button>
  );
}