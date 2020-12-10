// Import React dependencies.
import React, { useMemo, useState, useCallback, Fragment } from 'react'
// Import the Slate editor factory.
import { Editor, Transforms, createEditor, Range, Point,Node,Element as SlateElement, Text } from 'slate'
// Import the Slate components and React plugin.
import { Slate, Editable, withReact, useSlate } from 'slate-react'
import { withHistory } from 'slate-history'


const Header = props => {
    return (
        <h2 {...props.attributes} 
        className="header">
            {props.children}
        </h2>
    )
}
const List = props => {
    return (
        <ul {...props.attributes} 
        className="header">
            <li>{props.children}</li>
        </ul>
    )
}
// So this formatting is necessary to establish the format tree, but afterwards the
// HTML inflation will happen in the rendering type switch.
let flashcardFormat = {
    type: "fc-container",
    children: [
        {
            type: "fc-info",
            children: [
                {
                    type: "fc-tag-list",
                    children: [
                        {
                            type: "fc-tag",
                            children: [{text: " New Tag "}]
                        }
                    ]
                },
                {
                    type: "fc-front",
                    children: [
                        {
                            type:"paragraph",
                            children: [{text: "Front: "}]
                        }
                    ]
                },
                {
                    type: "fc-back",
                    children: [
                        {
                            type:"paragraph",
                            children: [{text: "Back: "}]
                        }
                    ]
                }
            ]
        }
    ]
}
const FcContainer = props => {
    return (
        <div {...props.attributes} 
        className="fcContainer">
            {props.children}
        </div>
    )
}
const FcInfo = props => {
    return (
        <div {...props.attributes} 
        className="fcInfo">
            {props.children}
        </div>
    )
}
const FcTagList = props => {
    return (
        <div {...props.attributes} 
        className="fcTagList">
            {props.children}
        </div>
    )
}
const FcTag = props => {
    return (
        <div {...props.attributes} 
        className="fcTag">
            {props.children}
        </div>
    )
}
const FcFront = props => {
    return (
        <div {...props.attributes} 
        className="fcFront">
            <div>
                {props.children}
            </div>
        </div>
    )
}
const FcBack = props => {
    return (
        <div {...props.attributes} 
        className="fcBack">
            <div>
                {props.children}
            </div>
        </div>
    )
}
const withFlashcards = editor => {
    //     const { deleteBackward, deleteForward, insertBreak } = editor
    const { deleteBackward, insertBreak, insertNode } = editor

    editor.deleteBackward = (...args) => {
        const { selection } = editor

        // TODO: Possible to set this to delete some number of characters backwards
        // to delete the entire flashcard with a backspace.
    
        if (selection && Range.isCollapsed(selection)) {
          const [cell] = Editor.nodes(editor, {
            match: n =>
            //   !Editor.isEditor(n) &&
              SlateElement.isElement(n) &&
              (n.type === 'fc-front' || n.type === 'fc-back'),
          })
    
          if (cell) {
            const [, cellPath] = cell
            const start = Editor.start(editor, cellPath)

            if (Point.equals(selection.anchor, start)) {
              return
            }
          }
          else{
              
            const match = Editor.above(editor, {
                match: n => Editor.isBlock(editor, n),
              })
        
              if (match) {
                const [block, path] = match
                const start = Editor.start(editor, path)
        
                if (
                  !Editor.isEditor(block) &&
                  SlateElement.isElement(block) &&
                  block.type !== 'paragraph' &&
                  Point.equals(selection.anchor, start)
                ) {
                  const newProperties = {
                    type: 'paragraph',
                  }
                  Transforms.setNodes(editor, newProperties)
        
                  if (block.type === 'list-item') {
                    Transforms.unwrapNodes(editor, {
                      match: n =>
                        !Editor.isEditor(n) &&
                        SlateElement.isElement(n) &&
                        n.type === 'bulleted-list',
                      split: true,
                    })
                  }
        
                  return
                }
              }
        
              deleteBackward(...args)
              return
          }
        }
    
        deleteBackward(...args)
      }

    editor.insertBreak = () => {
        const { selection } = editor

        if (selection) {
            const [table] = Editor.nodes(editor, {
                match: n =>
                SlateElement.isElement(n) &&
                n.type === 'fc-tag-list',
            })

            if (table) {
                const newTag = {
                    type: "fc-tag",
                    children: [{text:" New Tag "}]
                }
                insertNode(newTag)
                return
            }
        }

        insertBreak()
    }

    return editor
    
}

// Toolbar and associated operations
const Toolbar = () => {
    const editor = useSlate()

    const printFlash = () => {
        console.log(editor.children)
    }
    let addFC = (event) => {
        event.preventDefault()
        let clonefc = {...flashcardFormat}
        // TODO: Cannot add flashcard if already inside a flashcard.
        Transforms.insertNodes(
            editor, 
            clonefc
        )
        // TODO: Check if there are any headers above, grab it and place it into the flashcard.
    }
    let removeFC = () =>{
    }
    let showFlashcards = (event) =>{
        event.preventDefault()
        Array.from(document.querySelectorAll(".textEntryDocument>div>.paragraph")).forEach(para=>{
            para.classList.add("hide");
        })
        Array.from(document.querySelectorAll(".textEntryDocument>div>h2")).forEach(para=>{
            para.classList.add("hide");
        })
        Array.from(document.querySelectorAll(".textEntryDocument>div>ul>li")).forEach(para=>{
            para.classList.add("hide");
        })
    }
    let showAll = (event) =>{
        event.preventDefault()
        Array.from(document.querySelectorAll(".textEntryDocument>div>.paragraph")).forEach(para=>{
            para.classList.remove("hide");
        })
        Array.from(document.querySelectorAll(".textEntryDocument>div>h2")).forEach(para=>{
            para.classList.remove("hide");
        })
        Array.from(document.querySelectorAll(".textEntryDocument>div>ul>li")).forEach(para=>{
            para.classList.remove("hide");
        })
    }

    let tagSearch = (event) => {
        event.preventDefault()
        let searchTagList = document.getElementById("searchTags").value.split(",")
        searchTagList = searchTagList.map(n => n.trim())
        console.log(searchTagList)
        Array.from(document.querySelectorAll(".fcContainer")).forEach(para=>{
            let tagList = Array.from(para.querySelectorAll(".fcTag")).map(n=>n.textContent.trim())
            if (!tagList.some(v => searchTagList.includes(v))){
                para.classList.add("hide")
            }
        })
    }
    let clearSearch = (event) => {
        event.preventDefault()
        Array.from(document.querySelectorAll(".fcContainer")).forEach(para=>{
            para.classList.remove("hide")
        })
    }

    let boldText = (event) =>{
        event.preventDefault()
        Transforms.setNodes(
            editor,
            { bold: true },
            { match: n => Text.isText(n), split: true }
          )
    }
    let italicText = (event) =>{
        event.preventDefault()
        Transforms.setNodes(
            editor,
            { italic: true },
            { match: n => Text.isText(n), split: true }
          )
    }

    let exportToAnki = (event) =>{
        event.preventDefault()
        function download(data, filename, type) {
            var file = new Blob([data], {type: type});
            if (window.navigator.msSaveOrOpenBlob) // IE10+
                window.navigator.msSaveOrOpenBlob(file, filename);
            else { // Others
                var a = document.createElement("a"),
                        url = URL.createObjectURL(file);
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                setTimeout(function() {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);  
                }, 0); 
            }
        }
        // Looping through the flashcards and collecting all the info
        let fcList = Array.from(document.querySelectorAll(".fcContainer"))
        // TODO: only select the flashcards that don't have the "hide" class
        let textfcList = []
        fcList.forEach(fc => {
            let allInOne = ""
            allInOne += fc.querySelector(".fcFront").textContent + "\t"
            allInOne += fc.querySelector(".fcBack").textContent + "\t"
            // allInOne += fc.querySelector(".fc-tagList").textContent + "\t"
            textfcList.push(allInOne)
        })
        // Final download command.
        console.log(textfcList)
        console.log(fcList)
        download(textfcList.join("\n"), "something.txt", ".txt")        
    }

    let importAnki = (event) => {
        let fileToFc = (e) => {
            let text = e.target.result
            text.split("\n").forEach(textfc => {
                console.log(textfc)
                let [textfront, textback] = textfc.split("\t")
                console.log(textfc)
                console.log(textfront)
                console.log(textback)
                let newfc = {
                    type: "fc-container",
                    children: [
                        {
                            type: "fc-info",
                            children: [
                                {
                                    type: "fc-tag-list",
                                    children: [
                                        {
                                            type: "fc-tag",
                                            children: [{text: " New Tag "}]
                                        }
                                    ]
                                },
                                {
                                    type: "fc-front",
                                    children: [
                                        {
                                            type:"paragraph",
                                            children: [{text: textfront}]
                                        }
                                    ]
                                },
                                {
                                    type: "fc-back",
                                    children: [
                                        {
                                            type:"paragraph",
                                            children: [{text: textback}]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
                let oldPos = editor.selection.anchor
                console.log(oldPos)
                editor.insertBreak()
                Transforms.insertNodes(
                    editor, 
                    newfc
                )
                Transforms.select(
                    editor,
                    oldPos
                )
            })
        }

        var fr = new FileReader(); 
        fr.onload = fileToFc
        // fr.onload=function(){ 
        //     document.getElementById('output').textContent=fr.result; 
        // } 
        fr.readAsText(event.target.files["0"])
    }

    let makeHeader = (event) =>{
        event.preventDefault()
        // Otherwise, set the currently selected blocks type to "code".
        Transforms.setNodes(
            editor,
            { type: 'header' },
            { match: n => Editor.isBlock(editor, n) }
        )
    }
    let makeList = (event) =>{
        event.preventDefault()
        // Otherwise, set the currently selected blocks type to "code".
        Transforms.setNodes(
            editor,
            { type: 'list' },
            { match: n => Editor.isBlock(editor, n) }
        )
    }

    return (
      <div className="editorToolbar">
        <div className="fileSettings">
        <label style={{margin: "2px"}}>Import Anki</label>
            <input onChange={importAnki} type="file" name="inputfile" id="inputfile"/> 
            <button onClick={exportToAnki}>Export to Anki</button>
        </div>
        <div className="topRow">
            <button onClick={showFlashcards}>Show only flashcards</button>
            <button onClick={showAll}>Show all</button>
            <input type="text" id="searchTags"></input>
            <button onClick={tagSearch}>Search Tags</button>
            <button onClick={clearSearch}>Clear Search</button>
        </div>
        <div className="bottomRow">
            <button onClick={addFC}>Add Flashcard</button>
            {/* <button>Delete All Visible Flashcards</button> */}
            <button onClick={boldText}>Bold Text</button>
            <button onClick={italicText}>Italic Text</button>
            <button onClick={makeList}>Insert List</button>
            <button onClick={makeHeader}>Change into Header</button>
        </div>
      </div>
    )
}  
const Leaf = props => {
    return (
      <span
        {...props.attributes}
        style={{ fontWeight: props.leaf.bold ? 'bold' : 'normal',
                   fontStyle: props.leaf.italic ? 'italic' : 'normal' }}
      >
        {props.children}
      </span>
    )
}  
const Infobar = props => {
    return (
        <div className="infobar">
            <div className="infobarHeader">
                Recommendations
            </div>
            <div className="infobarContent">
                <div>The space under the flashcards is meant for you to write your own notes on the flashcard.</div>
                <div>Rewriting the information in your own words helps with memory.</div>
                <div>Restrict yourself to the minimum number of cues for the front.</div>
                <div>Keep the back simple. One concept per flashcard.</div>
                <div>Repitition can be useful when connecting different questions to the same answer.</div>
                <div>Some types of flashcards are - definition, summary, and helper questions. Make sure that you have a good balance of these!</div>
                <div>Mnemonics are helpful for summary flashcards.</div>
                <div>Helper questions can come from textbook questions with clear steps to solve the problem on the back.</div>
                <div>Definition flashcards should have a single word on the front and the definition on the back.</div>
                <div>Some flashcards can also be reversed front to back to easily create additional flashcards.</div>
                <div>The front can be a fill in the blank with the back having the word.</div>
            </div>
        </div>
    )
}
const TextEditor = () => {
    // Maintain stability across renders.
    const editor = useMemo(
        () => withFlashcards(withHistory(withReact(createEditor()))), 
        // () => withHistory(withReact(createEditor())), 
        [])
    // Keep track of state for the value of the editor.
    const [value, setValue] = useState([
        {
            type: 'paragraph',
            children: [{ text: 'Start entering text here' }],
          },
    ])

    // Define a rendering function based on the element passed to `props`. We use
    // `useCallback` here to memoize the function for subsequent renders.
    const renderElement = useCallback(props => {
        switch (props.element.type) {
            case 'header':
            return (<Header {...props} />)
            case 'list':
                return (<List {...props} />)    
            case "fc-container":
            return <FcContainer {...props}/>
            case "fc-info":
            return <FcInfo {...props}/>
            case "fc-front":
            return <FcFront {...props}/>
            case "fc-back":
            return <FcBack {...props}/>
            case "fc-tag-list":
            return <FcTagList {...props}/>
            case "fc-tag":
            return <FcTag {...props}/>    
            default:
            return <p className="paragraph" {...props.attributes}>{props.children}</p>
        }
    }, [])    

    const renderLeaf = useCallback(props => {
        return <Leaf {...props} />
      }, [])    

    // Render the Slate context.
    return (
      <Slate
        editor={editor}
        value={value}
        onChange={newValue => setValue(newValue)}>
        <div className="textEditor">
            <Toolbar/>
            <div className="textEntryDocument">
                <Editable
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                />
            </div>
            <Infobar/>
        </div>
      </Slate>
    )
}

export default TextEditor;