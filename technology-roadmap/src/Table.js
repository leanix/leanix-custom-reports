import React, {Component} from 'react';
import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table';

class Table extends Component {

  constructor (props) {
    super(props);
    this._formatBusCapLvl1 = this._formatBusCapLvl1.bind(this);
    this._formatBusCapLvl2 = this._formatBusCapLvl2.bind(this);
    this._formatUserGroups = this._formatUserGroups.bind(this);
    this._formatProjects = this._formatProjects.bind(this);
    this._formatProviders = this._formatProviders.bind(this);
  }

  // data & functions for BootstrapTable
  _formatBusCapLvl1 (cell, row) {
    return '<a href="' + this.props.baseUrl + '/businessCapabilities/' + row.IdBcLvl1 + '" target="_blank">' + row.bcLvl1 + '</a>';
  }

  _formatBusCapLvl2 (cell, row) {
    return '<a href="' + this.props.baseUrl + '/businessCapabilities/' + row.IdBcLvl2 + '" target="_blank">' + row.bcLvl2 + '</a>';
  }

  _formatUserGroups (cell, row) {
    return '<a href="' + this.props.baseUrl + '/consumers/' + row.IdArea + '" target="_blank">' + row.area + '</a>';
  }

  _formatProjects (cell, row) {
    return '<a href="' + this.props.baseUrl + '/projects/' + row.IdProj + '" target="_blank">' + row.proj + '</a>';
  }

  _formatProviders (cell, row) {
    return '<a href="' + this.props.baseUrl + '/providers/' + row.IdProv + '" target="_blank">' + row.prov + '</a>';
  }

  _formatEnum (cell, row, enumObject) {
    if (!enumObject) return ' ';
    return enumObject[ cell ];
  }

  _formatDateStart (cell, row) {
    if (!cell) { return; }
    const date = ('0' + cell.getDate()).slice(-2) + '/' + ('0' + (cell.getMonth() + 1)).slice(-2) + '/' + cell.getFullYear();
    return row.projStartPhase + ' -- ' + date;
  }

  _formatDateEnd (cell, row) {
    if (!cell) { return; }
    const date = ('0' + cell.getDate()).slice(-2) + '/' + ('0' + (cell.getMonth() + 1)).slice(-2) + '/' + cell.getFullYear();
    return row.projEndPhase + ' -- ' + date;
  }

  render () {
    return (
      <BootstrapTable
        data={ this.props.tableData } keyField='id'
        striped hover search pagination exportCSV>
        <TableHeaderColumn dataSort
                           dataField='bcLvl1'
                           width='300px'
                           dataAlign='left'
                           dataFormat={this._formatBusCapLvl1}
                           filter={{
                             type: 'TextFilter',
                             placeholder: 'Please enter a value'
                           }}>Main Domain L1</TableHeaderColumn>
        <TableHeaderColumn dataSort
                           dataField='bcLvl2'
                           width='300px'
                           dataAlign='left'
                           dataFormat={this._formatBusCapLvl2}
                           filter={{
                             type: 'TextFilter',
                             placeholder: 'Please enter a value'
                           }}>Main Domain L2</TableHeaderColumn>
        <TableHeaderColumn dataSort
                           dataField='area'
                           width='100px'
                           dataAlign='left'
                           dataFormat={this._formatUserGroups}
                           filter={{
                             type: 'TextFilter',
                             placeholder: 'Please enter a value'
                           }}>Area</TableHeaderColumn>
        <TableHeaderColumn dataSort
                           dataField='proj'
                           width='300px'
                           dataAlign='left'
                           dataFormat={this._formatProjects}
                           filter={{
                             type: 'TextFilter',
                             placeholder: 'Please enter a value'
                           }}>Project</TableHeaderColumn>
        <TableHeaderColumn dataSort
                           dataField='projStartTime'
                           width='250px'
                           dataAlign='right'
                           dataFormat={ this._formatDateStart }
                           filter={{
                             type: 'DateFilter',
                             dateComparators: [ '>', '<' ]
                           }}>Project Start</TableHeaderColumn>
        <TableHeaderColumn dataSort
                           dataField='projEndTime'
                           width='250px'
                           dataAlign='right'
                           dataFormat={ this._formatDateEnd }
                           filter={{
                             type: 'DateFilter',
                             dateComparators: [ '>', '<' ]
                           }}>Project End</TableHeaderColumn>
        <TableHeaderColumn dataSort
                           dataField='prov'
                           width='300px'
                           dataAlign='left'
                           dataFormat={this._formatProviders}
                           filter={{
                             type: 'TextFilter',
                             placeholder: 'Please enter a value'
                           }}>Provider</TableHeaderColumn>
        <TableHeaderColumn dataSort
                           dataField='scope'
                           width='120px'
                           dataAlign='left'
                           filterFormatted
                           dataFormat={ this._formatEnum }
                           formatExtraData={ this.props.tags.scopes }
                           filter={{
                             type: 'SelectFilter',
                             placeholder: '-- all --',
                             options: this.props.tags.scopes
                           }}>Scope</TableHeaderColumn>
        <TableHeaderColumn dataSort
                           dataField='host'
                           width='120px'
                           dataAlign='left'
                           filterFormatted
                           dataFormat={ this._formatEnum }
                           formatExtraData={ this.props.tags.hosts }
                           filter={{
                             type: 'SelectFilter',
                             placeholder: '-- all --',
                             options: this.props.tags.hosts
                           }}>Hosting</TableHeaderColumn>
        <TableHeaderColumn dataSort
                           dataField='notYetDef'
                           width='150px'
                           dataAlign='left'
                           filterFormatted
                           dataFormat={ this._formatEnum }
                           formatExtraData={ this.props.tags.notYetDefined }
                           filter={{
                             type: 'SelectFilter',
                             placeholder: '-- all --',
                             options: this.props.tags.notYetDefined
                           }}>Not Yet Defined</TableHeaderColumn>
      </BootstrapTable>
    );
  }
}

Table.propTypes = {
  tableData: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      id: React.PropTypes.number.isRequired,
      bcLvl1: React.PropTypes.string.isRequired,
      IdBcLvl1: React.PropTypes.string.isRequired,
      bcLvl2: React.PropTypes.string,
      IdBcLvl2: React.PropTypes.string,
      area: React.PropTypes.string,
      IdArea: React.PropTypes.string,
      proj: React.PropTypes.string.isRequired,
      IdProj: React.PropTypes.string.isRequired,
      projStartTime: React.PropTypes.instanceOf(Date),
      projStartPhase: React.PropTypes.string,
      projEndTime: React.PropTypes.instanceOf(Date),
      projEndPhase: React.PropTypes.string,
      prov: React.PropTypes.string,
      IdProv: React.PropTypes.string,
      scope: React.PropTypes.string,
      host: React.PropTypes.string,
      notYetDef: React.PropTypes.string
    }).isRequired
  ).isRequired,
  baseUrl: React.PropTypes.string.isRequired,
  tags: React.PropTypes.shape({
    scopes: React.PropTypes.object.isRequired,
    hosts: React.PropTypes.object.isRequired,
    notYetDefined: React.PropTypes.object.isRequired
  }).isRequired
};

export default Table;

