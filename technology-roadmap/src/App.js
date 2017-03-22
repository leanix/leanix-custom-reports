// app css
import './App.css';

// app dependencies
import React, {Component} from 'react';
import LeanixApi from './LeanixApi';
import FactsheetsIndex from './FactsheetsIndex';
import Table from './Table';

const LOADING_INIT = 0;
const LOADING_SUCCESSFUL = 1;
const LOADING_ERROR = 2;

class App extends Component {

  constructor (props) {
    super(props);
    this.leanixApi = new LeanixApi();
    this._handleLoadingSuccess = this._handleLoadingSuccess.bind(this);
    this._handleLoadingError = this._handleLoadingError.bind(this);
    this.state = {
      baseUrl: null,
      loadingState: LOADING_INIT,
      factsheets: null,
      tableData: null,
      tags: {
        scopes: {
          0: ' ',
          1: 'Core',
          2: 'Common',
          3: 'Distinct'
        },
        hosts: {
          0: ' ',
          1: 'Cloud',
          2: 'On-Premise'
        },
        notYetDefined: {
          0: ' ',
          1: 'NotYetDefined'
        }
      }
    };
  }

  componentDidMount () {
    try {
      // invoke 'this.leanixApi' calls here with this._handleLoadingSuccess & this._handleLoadingError
      this.leanixApi.queryFactsheets(this._handleLoadingSuccess, this._handleLoadingError,
        true, -1, [ 16, 18, 12, 13 ],
        [ 'projectHasBusinessCapabilities',
          'factSheetHasLifecycles',
          'factSheetHasParents',
          'projectHasConsumers',
          'projectHasProviders' ], //filterRelations
        [ 'resourceType',
          'ID',
          'level',
          'displayName',
          'name',
          'factSheetRefID',
          'projectID',
          'tags',
          'consumerID'] //filterAttributes
      );
    } catch (error) {
      this._handleLoadingError(error);
    }
  }

  _handleLoadingSuccess (data) {
    // transfer 'data' as state property as needed here
    try {
      const factsheetsIndex = new FactsheetsIndex(data);
      this.setState({
        baseUrl: this.leanixApi.queryParams.baseUrl,
        loadingState: LOADING_SUCCESSFUL,
        factsheets: factsheetsIndex,
        tableData: createTableData(factsheetsIndex, this.state.tags)
      });
    } catch (err) {
      this._handleLoadingError(err);
    }
  }

  _handleLoadingError (err) {
    console.error(err);
    this.setState({ loadingState: LOADING_ERROR });
  }

  render () {
    switch (this.state.loadingState) {
      case LOADING_INIT:
        return this._renderLoading();
      case LOADING_SUCCESSFUL:
        return this._renderSuccessful();
      case LOADING_ERROR:
        return this._renderError();
      default:
        throw new Error('Unknown loading state: ' + this.state.loadingState);
    }
  }

  _renderLoading () {
    return (
      <div className='loader' aria-hidden='true' aria-label='loading ...'/>
    );
  }

  _renderError () {
    return null;
  }

  _renderSuccessful () {
    return (
      <div className='container-fluid App'>
        <Table
          tableData={this.state.tableData}
          baseUrl={this.state.baseUrl}
          tags={this.state.tags}
        />
      </div>
    );
  }
}

export default App;

function createTableData (factsheets, tags) {
  const result = [];
  let resultId = 0;

  if (process.env.NODE_ENV === 'development') {
    console.log('factsheets: ', factsheets);
  }

  const bcList = factsheets.getSortedList('businessCapabilities');
  bcList.forEach((bcItem) => {
    const prjList = bcItem.projectHasBusinessCapabilities;
    if (prjList.length === 0) {
      // no entry for business capabilities without project(s)
      return;
    }

    // business capabilities
    const bcL1 = { name: null, id: null };
    const bcL2 = { name: null, id: null };
    if (bcItem.level === 0) {
      bcL1.name = bcItem.name;
      bcL1.id = bcItem.ID;
    } else {
      const bcParentID = bcItem.factSheetHasParents[ 0 ].factSheetRefID;
      bcL1.name = factsheets.byID[ bcParentID ].displayName;
      bcL1.id = bcParentID;

      bcL2.name = bcItem.name;
      bcL2.id = bcItem.ID;
    }

    // projects
    prjList.forEach((prjItem) => {
      const project = factsheets.byID[ prjItem.projectID ];

      // project start and end
      const lifecycles = getLifecycles(project);
      let start = lifecycles[ 3 ];
      if (!start) {
        start = lifecycles[ 2 ];
      }
      if (!start) {
        start = lifecycles[ 1 ];
      }
      if (!start) {
        start = lifecycles[ 4 ];
      }
      let end = lifecycles[ 5 ];

      // tags
      let prjTags = { scope: null, host: null, notYetDef: null };
      project.tags.forEach((tag) => {
        let tmp;
        if (!prjTags.scope) {
          tmp = getEnumKey(tags.scopes, tag);
          prjTags.scope = tmp;
        }
        if (!tmp && !prjTags.host) {
          tmp = getEnumKey(tags.hosts, tag);
          prjTags.host = tmp;
        }
        if (!tmp && !prjTags.notYetDef) {
          tmp = getEnumKey(tags.notYetDefined, tag);
          prjTags.notYetDef = tmp;
        }
      });

      let withoutAreasAndProviders = true;

      // areas
      const prjCons = project.projectHasConsumers;
      if (prjCons.length) {
        withoutAreasAndProviders = false;
        prjCons.forEach((consItem) => {
          const cons = factsheets.byID[ consItem.consumerID ];
          const prjProv = project.projectHasProviders;
          if (prjProv.length) {
            //areas and providers
            prjProv.forEach((provItem) => {
              const prov = factsheets.byID[ provItem.providerID ];
              result.push({
                id: resultId++,
                bcLvl1: bcL1.name,
                IdBcLvl1: bcL1.id,
                bcLvl2: bcL2.name,
                IdBcLvl2: bcL2.id,
                area: cons.name,
                IdArea: cons.ID,
                proj: project.name,
                IdProj: project.ID,
                projStartTime: start ? start.start : null,
                projStartPhase: start ? start.phase : null,
                projEndTime: end ? end.start : null,
                projEndPhase: end ? end.phase : null,
                prov: prov.name,
                IdProv: prov.ID,
                scope: prjTags.scope ? prjTags.scope : '0',
                host: prjTags.host ? prjTags.host : '0',
                notYetDef: prjTags.notYetDef ? prjTags.notYetDef : '0'
              });
            });
          } else {
            // only areas
            result.push({
              id: resultId++,
              bcLvl1: bcL1.name,
              IdBcLvl1: bcL1.id,
              bcLvl2: bcL2.name,
              IdBcLvl2: bcL2.id,
              area: cons.name,
              IdArea: cons.ID,
              proj: project.name,
              IdProj: project.ID,
              projStartTime: start ? start.start : null,
              projStartPhase: start ? start.phase : null,
              projEndTime: end ? end.start : null,
              projEndPhase: end ? end.phase : null,
              prov: '',
              IdProv: null,
              scope: prjTags.scope ? prjTags.scope : '0',
              host: prjTags.host ? prjTags.host : '0',
              notYetDef: prjTags.notYetDef ? prjTags.notYetDef : '0'
            });
          }
        });
      } else {
        // providers
        const prjProv = project.projectHasProviders;
        if (prjProv.length) {
          // only providers
          withoutAreasAndProviders = false;
          prjProv.forEach((provItem) => {
            const prov = factsheets.byID[ provItem.providerID ];
            result.push({
              id: resultId++,
              bcLvl1: bcL1.name,
              IdBcLvl1: bcL1.id,
              bcLvl2: bcL2.name,
              IdBcLvl2: bcL2.id,
              area: '',
              IdArea: null,
              proj: project.name,
              IdProj: project.ID,
              projStartTime: start ? start.start : null,
              projStartPhase: start ? start.phase : null,
              projEndTime: end ? end.start : null,
              projEndPhase: end ? end.phase : null,
              prov: prov.name,
              IdProv: prov.ID,
              scope: prjTags.scope ? prjTags.scope : '0',
              host: prjTags.host ? prjTags.host : '0',
              notYetDef: prjTags.notYetDef ? prjTags.notYetDef : '0'
            });
          });
        }
      }

      // neither areas nor providers
      if (withoutAreasAndProviders) {
        result.push({
          id: resultId++,
          bcLvl1: bcL1.name,
          IdBcLvl1: bcL1.id,
          bcLvl2: bcL2.name,
          IdBcLvl2: bcL2.id,
          area: '',
          IdArea: null,
          proj: project.name,
          IdProj: project.ID,
          projStartTime: start ? start.start : null,
          projStartPhase: start ? start.phase : null,
          projEndTime: end ? end.start : null,
          projEndPhase: end ? end.phase : null,
          prov: '',
          IdProv: null,
          scope: prjTags.scope ? prjTags.scope : '0',
          host: prjTags.host ? prjTags.host : '0',
          notYetDef: prjTags.notYetDef ? prjTags.notYetDef : '0'
        });
      }
    });
  });

  return result;
}

function getEnumKey (enumObject, value) {
  if (!value || value === '') {
    return 0; // first element in enum objects always ' '
  }
  for (let key in enumObject) {
    if (enumObject[ key ] === value) {
      return key;
    }
  }
  return null;
}

const lifecycles = {
  1: "Plan",
  2: "Phase In",
  3: "Active",
  4: "Phase Out",
  5: "End of Life"
}

function getLifecycle (item, stateID) {
  for (var i = 0; i < item.factSheetHasLifecycles.length; i++) {
    if (item.factSheetHasLifecycles[ i ].lifecycleStateID === stateID) {
      return {
        phase: lifecycles[ item.factSheetHasLifecycles[ i ].lifecycleStateID ],
        phaseID: item.factSheetHasLifecycles[ i ].lifecycleStateID,
        start: new Date(item.factSheetHasLifecycles[ i ].startDate)
      };
    }
  }
}

function getLifecycles (item) {
  const result = {};
  for (let key in lifecycles) {
    if (lifecycles.hasOwnProperty(key)) {
      const lifecycle = getLifecycle(item, key);
      if (lifecycle) {
        result[ lifecycle.phaseID ] = lifecycle;
      }
    }
  }
  return result;
}