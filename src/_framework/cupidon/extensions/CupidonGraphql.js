import React from "react";
import _ from "lodash";

import { Link } from "react-router-dom";

import Panel from "components/Panel/Panel";

import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";

import { withStyles } from '@material-ui/core/styles';

const styles = ({
    schema: {
        whiteSpace: "pre-wrap",
        fontFamily: "monospace"
    }
});

class GraphqlComponent extends React.Component {
    state = {
        data: {
            schema: ""
        }
    };

    componentDidMount() {
        this.refreshData();
    }

    refreshData = () => {
        this.props.api("initial").then(res => {
            if (res && res.data) {
                this.setState({ data: res.data });
            }
        });
    };

    render() {
        const { classes } = this.props;
        const {
            data: { schema }
        } = this.state;
        

        return (
            <Grid container spacing={16}>
                <Grid item md={6}>
                    <Panel title="Graphql Schema" color="">
                        <p className={classes.schema}>{schema}</p>
                    </Panel>
                </Grid>
            </Grid>
        );
    }
}

export default withStyles(styles)(GraphqlComponent);
