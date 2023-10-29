import React from 'react'
import {ReactTags, ReactTagsProps} from "react-tag-autocomplete";

import './Tags.scss'

export type TagsProps = {
    onAdd: ReactTagsProps['onAdd'],
    onDelete: ReactTagsProps['onDelete'],
    selected: ReactTagsProps['selected'],
    suggestions: ReactTagsProps['suggestions'],
    placeholderText: ReactTagsProps['placeholderText'],
    classNames?: string
}

const Tags = ({onAdd, onDelete, selected, suggestions,classNames}: TagsProps) => {
    return (
        <ReactTags
            classNames={{
                root: `react-tags ${classNames ? classNames : ''}`,
                rootIsActive: "is-active",
                rootIsDisabled: "is-disabled",
                rootIsInvalid: "is-invalid",
                label: "react-tags__label",
                tagList: "react-tags__list",
                tagListItem: "react-tags__list-item",
                tag: "react-tags__tag",
                tagName: "react-tags__tag-name",
                comboBox: "react-tags__combobox",
                input: "react-tags__combobox-input",
                listBox: "react-tags__listbox",
                option: "react-tags__listbox-option",
                optionIsActive: "is-active",
                highlight: "react-tags__listbox-option-highlight"
            }}
            onAdd={onAdd}
            onDelete={onDelete}
            selected={selected}
            suggestions={suggestions}
            labelText=""
            placeholderText="Add new preset"
        />
    )
}

export default Tags