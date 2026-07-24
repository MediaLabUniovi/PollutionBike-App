export const colors = {
    background: "#1a1b2e", // oklch(0.13 0.01 260)
    foreground: "#ffffff", // oklch(0.95 0 0)
    card: "#232436",       // oklch(0.18 0.01 260) - slightly lighter than bg
    primary: "#2dd4bf",    // oklch(0.7 0.15 180) - teal/cyan
    primaryForeground: "#1a1b2e",
    secondary: "#2e3048",  // oklch(0.25 0.01 260)
    muted: "#2e3048",
    mutedForeground: "#a1a1aa", // oklch(0.65 0 0)
    success: "#22c55e",    // oklch(0.7 0.18 145)
    warning: "#eab308",    // oklch(0.75 0.15 85)
    destructive: "#ef4444",// oklch(0.6 0.2 25)
    border: "#3f4158",     // oklch(0.3 0.01 260)
    chart1: "#2dd4bf",
    chart2: "#22c55e",
    chart3: "#eab308",
    chart4: "#ef4444",
    chart5: "#a855f7", // oklch(0.65 0.15 280) - purple
};

export const chartColors = {
    good: colors.success,
    moderate: colors.warning,
    unhealthy: "#f97316", // orange
    bad: colors.destructive,
};
