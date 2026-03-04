export default function AdminDashboard() {
    return (
        <div className="space-y-6 p-4 md:p-6 md:pb-6">
            {/* Welcome Card */}
            <div className="rounded-xl border border-border bg-gradient-to-r from-orange-500/5 via-orange-500/10 to-transparent p-6">
                <div className="flex items-center gap-2 text-sm text-orange-500">
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-orange-400 opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-orange-500" />
                    </span>
                    Admin Panel
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                    Admin Dashboard 🛡️
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage users, analytics, and platform settings.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Total Users", value: "1,024", color: "text-blue-500" },
                    { label: "Active Today", value: "256", color: "text-emerald-500" },
                    { label: "Exams Created", value: "48", color: "text-amber-500" },
                    { label: "Reports", value: "7", color: "text-rose-500" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-lg border border-border bg-card p-4"
                    >
                        <p className="text-xs font-medium text-muted-foreground">
                            {stat.label}
                        </p>
                        <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
