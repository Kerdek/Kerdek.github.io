import * as React from "react";
import { getMonaco, loadMonaco } from "../../../monaco-loader";
/**
 * Can be used to render content only when monaco is loaded.
 */
export class MonacoLoader extends React.Component {
    constructor(props) {
        super(props);
        this.state = { monaco: getMonaco() };
        if (!this.state.monaco) {
            loadMonaco().then((monaco) => {
                this.setState({
                    monaco,
                });
            });
        }
    }
    render() {
        if (!this.state.monaco) {
            return null;
        }
        return this.props.children(this.state.monaco);
    }
}
/**
 * Decorates a component so that it only gets mounted when monaco is loaded.
 */
export function withLoadedMonaco(Component) {
    return (props) => (<MonacoLoader>{() => <Component {...props}/>}</MonacoLoader>);
}
//# sourceMappingURL=MonacoLoader.js.map