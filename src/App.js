import React, { useState, useEffect } from "react";
import "./App.css";
import Select from "react-select";
import "@aws-amplify/ui-react/styles.css";
import { API, Storage } from 'aws-amplify';
import {
  Button,
  Flex,
  Heading,
  Image,
  Text,
  TextField,
  View,
  withAuthenticator,
} from '@aws-amplify/ui-react';
import { listNotes } from "./graphql/queries";
import {
  createNote as createNoteMutation,
  // deleteNote as deleteNoteMutation,
} from "./graphql/mutations";
import Picture from './images/family1_R.jpg';
// import Picture2 from './images/family2_R.jpg';

const App = ({ signOut }) => {
  const [notes, setNotes] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState();
  const optionList = [
    { value: "found", label: "Found" },
    { value: "lost", label: "Lost" }
  ];

  useEffect(() => {
    fetchNotes();
  }, []);

  function handleSelect(data) {
    setSelectedOptions(data);
  }

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const url = await Storage.get(note.name);
          note.image = url;
        }
        return note;
      })
    );
    setNotes(notesFromAPI);
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get("image");
    const data = {
      category: form.get("category"),
      name: form.get("name"),
      description: form.get("description"),
      contact: form.get("contact"),
      image: image.name
    };
    if (!!data.image) await Storage.put(data.name, image);
    await API.graphql({
      query: createNoteMutation,
      variables: { input: data },
    });
    fetchNotes();
    event.target.reset();
  }

  // async function deleteNote({ id, name }) {
  //   const newNotes = notes.filter((note) => note.id !== id);
  //   setNotes(newNotes);
  //   await Storage.remove(name);
  //   await API.graphql({
  //     query: deleteNoteMutation,
  //     variables: { input: { id } },
  //   });
  // }

  return (
    <View className="App">
      <div>
         <img style={{ width: 600, height: 300 }} src={Picture} alt="React Logo" />
      </div>
      <Heading level={1}>Sabrina Pet Detectives</Heading>
      <Heading level={2}>Please key in the details of the pet that is found or lost</Heading>
      <View as="form" margin="3rem 0" onSubmit={createNote}>
        <Flex direction="row" justifyContent="center">
          <Select
            name = "category"
            options={optionList}
            placeholder="Lost or Found"
            value={selectedOptions}
            onChange={handleSelect}
            required
          />
          <TextField
            name="name"
            placeholder="Pet Name"
            label="Pet Name"
            labelHidden
            variation="quiet"
            required
          />
          <TextField
            name="description"
            placeholder="Pet Description"
            label="Pet Description"
            labelHidden
            variation="quiet"
            required
          />
          <TextField
            name="contact"
            placeholder="Email to respond"
            label="Email to respond"
            labelHidden
            variation="quiet"
            required
          />
          <View
            name="image"
            as="input"
            type="file"
            style={{ alignSelf: "end" }}
          />
          <Button type="submit" variation="primary">
            Create Note
          </Button>
        </Flex>
      </View>
      <Heading level={2}>Recent Lost and Found Reports</Heading>
      <View margin="3rem 0">
        {notes.map((note) => (
          <Flex
            key={note.id || note.name}
            direction="row"
            justifyContent="center"
            alignItems="center"
          >
            <Text as="strong" fontWeight={700}>
              {note.category}
            </Text>
            <Text>
              {note.name}
            </Text>
            <Text as="span">{note.description}</Text>
            {note.image && (
              <Image
                src={note.image}
                alt={`visual aid for ${notes.name}`}
                style={{ width: 400 }}
              />
            )}
            {/* <Button variation="link" onClick={() => deleteNote(note)}>
              Delete
            </Button> */}
          </Flex>
        ))}
      </View>
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
};

export default withAuthenticator(App);