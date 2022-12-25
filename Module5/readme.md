# Assignment Instructions

## General Idea
Your starting point for this assignment will be the code in the `examples/Lecture59` folder.

Your task is fairly simply.

First, change the 2 buttons at the top of the website to say `My Info` and `Sign Up` instead of `About` and `Awards`.

**Task 1:**
When the user clicks on the `Sign Up` button, they should be taken to a view that lets them "sign up" for the newsletter (that will never come :-) ) of the restaurant. The sign up form should ask for the following information: first name, last name, email address, and phone number. It should also ask the user to specify the menu number that's their favorite dish. (The menu number is the `short_name` attribute of each menu item).

If everything is valid, save the user's preference somewhere in your client app such that you can retrieve it in another view/component/controller/etc. (Hint: think service). Once saved, display a message below the form saying `Your information has been saved`.

**Task 2:**
When the user clicks on `My Info` button, they should be taken to another view where it shows them their "registered" information, including the favorite menu item they picked. When showing the favorite menu item, display the picture of the menu item as well as its title and description.

If the user hasn't yet "registered" through the `Sign Up` button, simply display a message saying: `Not Signed Up Yet. Sign up Now!`. The words "Sign up Now!" should be a link to the same view as the `Sign Up` link points to.
