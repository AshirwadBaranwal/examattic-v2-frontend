import {
    LayoutDashboard,
    BookOpen,
    GraduationCap,
    Settings,
    Users,
    BarChart3,
    FileText,
    Shield,
    HelpCircle,
    type LucideIcon,
} from "lucide-react";

export type NavItem = {
    title: string;
    href: string;
    icon: LucideIcon;
};

// Sidebar items based on role
const studentNav: NavItem[] = [
    { title: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { title: "Courses", href: "/student/courses", icon: BookOpen },
    { title: "Exams", href: "/student/exams", icon: GraduationCap },
    { title: "Results", href: "/student/results", icon: FileText },
    { title: "Settings", href: "/student/settings", icon: Settings },
];

const adminNav: NavItem[] = [
    { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Exams", href: "/admin/exams", icon: GraduationCap },
    { title: "Subjects", href: "/admin/subjects", icon: BookOpen },
    { title: "PYQ", href: "/admin/pyq", icon: FileText },
    { title: "Mocks", href: "/admin/mock", icon: FileText },
    { title: "Questions", href: "/admin/questions", icon: HelpCircle },
    { title: "Users", href: "/admin/users", icon: Users },
    { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { title: "Settings", href: "/admin/settings", icon: Settings },
];

export function getNavItems(role: string): NavItem[] {
    switch (role) {
        case "admin":
            return adminNav;
        case "student":
        default:
            return studentNav;
    }
}
