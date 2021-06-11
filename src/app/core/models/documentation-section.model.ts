export interface DocumentationSection {
    title: string;
    icon: string;
    description: string;
    path: string;
    items: { title: string; path: string; roles: string[] }[];
}
