export default function StudentDashboard() {
    return (
        <div className="space-y-6">
            {/* Welcome Card */}
            <div className="rounded-xl border border-border bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-transparent p-6">
                <div className="flex items-center gap-2 text-sm text-emerald-500">
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                    </span>
                    Keep Learning!
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                    Student Dashboard 👋
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Track your progress and manage your courses.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Enrolled Courses", value: "5", color: "text-blue-500" },
                    { label: "Completed Exams", value: "12", color: "text-emerald-500" },
                    { label: "Average Score", value: "78%", color: "text-amber-500" },
                    { label: "Pending Tasks", value: "3", color: "text-rose-500" },
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
