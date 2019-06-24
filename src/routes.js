import HomeScreen from "./screens/home";

export default function getAppRoutes() {
    return [
        {
            path: "/",
            component: HomeScreen,
            navBarTitle: "Home",
        }
    ];
}