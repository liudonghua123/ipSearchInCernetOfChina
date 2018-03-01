// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.css';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {
  Card,
  CardActions,
  CardHeader,
  CardMedia,
  CardTitle,
  CardText
} from 'material-ui/Card';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import EnhancedTextarea from 'material-ui/TextField/EnhancedTextarea';
import { GridList, GridTile } from 'material-ui/GridList';
import Divider from 'material-ui/Divider';
import { List, ListItem } from 'material-ui/List';
import request from 'request';
import cheerio from 'cheerio';
// import { Iconv } from 'iconv';
import iconv from 'iconv-lite';
import ip from 'ip';
import util from 'util';

export default class Home extends Component {

  constructor(props) {
    super(props);
    this.state = {
      displayText: '',
      searchIp: '',
    };
  }

  ipData = [];

  handleUpdateDatabase = (event) => {
    request(
      {
        url: 'https://www.nic.edu.cn/RS/ipstat/internalip/real.html',
        strictSSL: false,
        encoding: null
      },
      (error, response, html) => {
        if (!error && response.statusCode == 200) {
          // const iconv = new Iconv('gb18030', 'utf-8');
          // console.log(iconv.decode(html, 'gbk'));
          const $ = cheerio.load(iconv.decode(html, 'gbk'));
          const preText = $('pre').text();
          // remove first three elements
          const content = preText.split(/\n/).splice(3);
          // remove last one element
          content.splice(content.length - 1, 1);
          let subnetMaskLength;
          this.ipData.splice(0);
          for (const line of content) {
            const pieces = line.split(/\s+/);
            // console.info(util.format('%s, %s', pieces[0], pieces[2]));
            subnetMaskLength = ip.subnet(pieces[0], pieces[2]).subnetMaskLength;
            this.ipData.push(util.format('%s/%s', pieces[0], subnetMaskLength));
          }
          console.log(this.ipData);
          this.setState({ displayText: this.ipData.join('\n') });
        } else {
          console.error(error);
        }
      }
    );
  }

  handleIpChange = (event) => {
    this.setState({
      searchIp: event.target.value,
    });
  }

  handleSearch = (event) => {
    // For checking if a string is blank or contains only white-space:
    // https://stackoverflow.com/questions/154059/how-do-you-check-for-an-empty-string-in-javascript
    if (this.state.searchIp.length === 0 || !this.state.searchIp.trim()) {
      this.setState({ displayText: util.format('search ip is empty') });
      return;
    }
    for (const ipWithMaskLength of this.ipData) {
      if (ip.cidrSubnet(ipWithMaskLength).contains(this.state.searchIp)) {
        this.setState({ displayText: util.format('%s matched in %s', this.state.searchIp, ipWithMaskLength) });
        return;
      }
    }
    this.setState({ displayText: util.format('%s not matched in database', this.state.searchIp) });
  }

  render() {
    return (
      <MuiThemeProvider>
        <div>
          <Card className={styles.marginContainer}>
            <RaisedButton
              label="Update IP Databases"
              secondary
              fullWidth
              onClick={() => this.handleUpdateDatabase()}
            />
          </Card>
          <Card className={styles.marginContainer}>
            <GridList cols={3} cellHeight={40} padding={1}>
              <GridTile cols={2} rows={1}>
                <TextField hintText="IPv4 Address" value={this.state.searchIp} onChange={this.handleIpChange} fullWidth />
              </GridTile>
              <GridTile cols={1} rows={1}>
                <RaisedButton label="Search" primary fullWidth onClick={() => this.handleSearch()} />
              </GridTile>
            </GridList>
          </Card>
          <Card className={styles.marginContainer}>
            <EnhancedTextarea value={this.state.displayText} rows={15} rowsMax={15} disabled />
          </Card>
        </div>
      </MuiThemeProvider>
    );
  }
}
