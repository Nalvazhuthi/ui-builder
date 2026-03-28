import React from "react";
import styles from "./Button.module.scss";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "pill" | "tb";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = "primary", 
  size = "md", 
  className = "", 
  children, 
  ...props 
}) => {
  const buttonClass = `${styles.button} ${styles[variant]} ${styles[size]} ${className}`;
  
  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
};

export default Button;
