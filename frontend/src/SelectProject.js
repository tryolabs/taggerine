import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { AutoSizer, List } from 'react-virtualized'

import axios from 'axios'

import './SelectProject.css'

const PROJECT_ID_KEY = 'project_id'
const API_URL = process.env.REACT_APP_API_URL

class SelectProject extends Component {
	state = {
		projects: [],
		currentName: ''
	}
	componentDidMount() {
		axios.get(`${API_URL}/projects/`).then(response => {
			this.setState({ projects: response.data.projects })
		})
	}

	_selectProject = projectId => {
		window.localStorage.setItem(PROJECT_ID_KEY, projectId)
		this.props.history.push('/')
	}

	_projectRowRenderer = ({ index, key, style }) => {
		const project = this.state.projects[index]
		return (
			<div key={key} style={style}>
				<div className="project-list-item" onClick={() => this._selectProject(project.id)}>
					<div className="project-item">
						<span className="project-item-name">{project.name}</span>
					</div>
				</div>
			</div>
		)
	}

	handleChange = event => {
		this.setState({currentName: event.target.value})
	}

	handleSubmit = event => {
		const data = {name: this.state.currentName}
        axios
          .post(`${API_URL}/projects/`, data)
          .then(response => {
			window.localStorage.setItem(PROJECT_ID_KEY, response.data.project_id)
			this.props.history.push('/')
          })
		event.preventDefault()
	}

	render() {
		return (
			<div className="select-project">
				<header id="header">
					<h1 className="title">{'\uD83C\uDF4A'} Taggerine</h1>
				</header>
				<div id="left-panel" />
				<div id="new-project">
					<form>
					  <label>
					    Name:
					    <input type="text" name="name" value={this.state.currentName} onChange={this.handleChange}/>
					  </label>
					  <button onClick={this.handleSubmit}>create project</button>
					</form>
				</div>
				<div id="existing-project">
					<AutoSizer>
						{({ width, height }) => (
							<List
								overscanRowCount={10}
								noRowsRenderer={() => (
									<div className="project-list-empty">No Projects</div>
								)}
								rowCount={Object.keys(this.state.projects).length}
								rowHeight={130}
								rowRenderer={this._projectRowRenderer}
								width={width}
								height={height}
								className="project-list"
							/>
						)}
					</AutoSizer>
				</div>
				<div id="right-panel" />
			</div>
		)
	}
}

export default withRouter(SelectProject)
