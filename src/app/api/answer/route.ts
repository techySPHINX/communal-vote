import { answerCollection, db } from "@/models/name";
import { databases, users } from "@/models/server/config";
import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { UserPrefs } from "@/store/Auth";

//answer to be upvoted by cerating a post

export async function POST(request: NextRequest) {
  try {
    const { questionId, answer, authorId } = await request.json();

    // Create a new answer document
    const createAnswerDoc = () => ({
      content: answer,
      authorId,
      questionId,
    });

    const createDocument = async () =>
      await databases.createDocument(
        db,
        answerCollection,
        ID.unique(),
        createAnswerDoc()
      );

    // Increase author reputation
    const increaseReputation = async () => {
      const prefs = await users.getPrefs<UserPrefs>(authorId);
      await users.updatePrefs(authorId, {
        reputation: Number(prefs.reputation) + 1,
      });
    };

    return NextResponse.json(await createDocument(), {
      status: 201,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Error creating answer",
      },
      {
        status: error?.status || error?.code || 500,
      }
    );
  }
}

//answer to be downvoted for deletion

export async function DELETE(request: NextRequest) {
  try {
    const { answerId } = await request.json();

    const answer = await databases.getDocument(db, answerCollection, answerId);

    const response = await databases.deleteDocument(
      db,
      answerCollection,
      answerId
    );

    //decrese the reputation
    const prefs = await users.getPrefs<UserPrefs>(answer.authorId);
    await users.updatePrefs(answer.authorId, {
      reputation: Number(prefs.reputation) - 1,
    });

    return NextResponse.json({ data: response }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error?.message || "Error deleting the answer",
      },
      {
        status: error?.status || error?.code || 500,
      }
    );
  }
}
