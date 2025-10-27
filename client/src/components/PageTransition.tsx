import React from "react";
import { motion } from "framer-motion";

type Props = { children?: React.ReactNode };

const variants = {
	initial: { opacity: 0, y: 8, scale: 0.995 },
	in: { opacity: 1, y: 0, scale: 1 },
	out: { opacity: 0, y: -8, scale: 0.995 },
};
const transition = { duration: 0.18, ease: "easeOut" };

export default function PageTransition({ children }: Props) {
	return (
		<motion.div
			variants={variants}
			initial="initial"
			animate="in"
			exit="out"
			transition={transition}
			style={{ width: "100%" }}
		>
			{children}
		</motion.div>
	);
}
