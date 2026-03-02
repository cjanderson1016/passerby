/*
  File Name: Local Storage.tsx

  Description: Generic helper function that can be called to store information in local storage

  Author(s): Owen Berkholtz
*/

// Store item
export function setItem(key: string, value: unknown){
    try{
        window.localStorage.setItem(key, JSON.stringify(value));
    }
    catch (error){
        console.log(error);
    }
}


// Retrieve the item from storage
export function getItem(key: string){
    try{
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : undefined;
    }
    catch(error){
        console.log(error);
    }
}