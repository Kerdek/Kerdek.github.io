import * as React from "react";
export class Loader extends React.Component {
    constructor(props) {
        super(props);
        this.state = { value: undefined, hasValue: false };
        if (!this.state.value) {
            this.props.loader().then((value) => {
                this.setState({
                    hasValue: true,
                    value,
                });
            });
        }
    }
    render() {
        if (!this.state.hasValue) {
            return null;
        }
        return this.props.children(this.state.value);
    }
}
/**
 * Decorates a component so that it only gets mounted when monaco is loaded.
 */
export function withLoader(loader) {
    return (Component) => {
        return (props) => (<Loader loader={loader}>{() => <Component {...props}/>}</Loader>);
    };
}
//# sourceMappingURL=Loader.js.map