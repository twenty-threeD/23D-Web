type DoButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
};

export default function DoButton({ children, onClick }: DoButtonProps) {
  return (
    <button 
      onClick={onClick} 
      className="w-full py-2 border text-center border-zinc-300 rounded-md"
    >
      {children}
    </button>
  );
}